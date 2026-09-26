import htm from 'htm/mini'
import render from 'dom-serializer'
import {isSignal, effect} from '../signal/index.js'
import {HtmlTemplate} from './template.js'
import {Comment, Element as BaseElement} from './ssr-dom.js'
import {parsePart, parseTemplateValues} from './html.js'

export function serialize(template, {Element, afterParse} = {}) {
  const context = {Element: Element ?? BaseElement}
  const boundCreateElement = createElement.bind(context)
  const baseParse = htm.bind(boundCreateElement)
  function parse(innerTemplate) {
    const nodeOrNodes = baseParse(
      innerTemplate.strings,
      ...parseTemplateValues(innerTemplate.values),
    )
    const nodes = Array.isArray(nodeOrNodes) ? nodeOrNodes : [nodeOrNodes]

    return nodes.flatMap((node) => {
      const attributeBindings = Object.entries(node.parts.attributes)
        .map(([attribute, index]) => `${attribute}=${index}`)
        .join(',')

      return attributeBindings
        ? [new Comment(`attribute-parts ${attributeBindings}`), node]
        : node
    })
  }

  context.parse = parse

  const parseResult = parse(template)
  afterParse?.()
  return render(parseResult)
}

function createElement(tag, attributes, ...children) {
  attributes ??= {}

  const {parse, Element} = this

  const element = new Element(tag, this)

  for (const [attributeName, attributeValue] of Object.entries(attributes)) {
    const parsedPart = parsePart(attributeValue)

    if (parsedPart) {
      const partName = parsedPart.groups.name
      element.parts.attributes[attributeName] = partName
    } else if (Number.isSafeInteger(attributeValue?.index)) {
      element.parts.attributes[attributeName] = attributeValue?.index
    }

    if (!parsedPart && !attributeName.startsWith('on:')) {
      if (
        attributeName.startsWith('prop:') &&
        !isSignal(attributeValue?.value)
      ) {
        const property = attributeName.slice(5)
        element[property] = Object.is(attributeValue?.value, undefined)
          ? attributeValue
          : attributeValue.value
      } else if (typeof attributeValue?.value === 'string') {
        element.setAttribute(attributeName, attributeValue?.value)
      } else if (typeof attributeValue === 'string') {
        element.setAttribute(attributeName, attributeValue)
      } else if (typeof attributeValue === 'boolean') {
        element.setAttribute(attributeName, '')
      }
    }

    if (!attributeName.startsWith('on:') && isSignal(attributeValue?.value)) {
      effect(() => {
        if (attributeName.startsWith('prop:')) {
          const property = attributeName.slice(5)
          element[property] = attributeValue.value.get()
        } else {
          element.setAttribute(attributeName, attributeValue.value.get())
        }
      })
    }
  }

  for (const child of children.flatMap((c) =>
    Array.isArray(c?.value) ? c.value.map((v) => ({value: v})) : c,
  )) {
    const parsedPart = parsePart(child)

    if (parsedPart) {
      const partName = parsedPart.groups.name
      element.append(
        new Comment(`child-node-part ${partName}`),
        new Comment('/child-node-part'),
      )
    } else if (child?.value instanceof HtmlTemplate) {
      const template = child.value
      element.append(
        new Comment(
          Number.isSafeInteger(child.index)
            ? `template ${child.index}`
            : 'template',
        ),
        ...parse(template),
        new Comment('/template'),
      )
    } else if (isSignal(child?.value)) {
      const start = new Comment(`child-node-part ${child.index}`)
      const end = new Comment('/child-node-part')
      element.append(start, end)
      effect(() => {
        const value = child.value.get()

        const nodesToRemove = []
        let currentNode = start.nextSibling
        while (currentNode !== end) {
          nodesToRemove.push(currentNode)
          currentNode = currentNode.nextSibling
        }

        for (const node of nodesToRemove) {
          node.remove()
        }

        if (value instanceof HtmlTemplate) {
          start.after(
            new Comment('template'),
            ...parse(value),
            new Comment('/template'),
          )
        } else if (
          Array.isArray(value) &&
          value.every((v) => v instanceof HtmlTemplate)
        ) {
          start.after(
            ...value.flatMap((v) => [
              new Comment('template'),
              ...parse(v),
              new Comment('/template'),
            ]),
          )
        } else {
          start.after(value)
        }
      })
    } else {
      if (child instanceof Element) {
        const attributeBindings = Object.entries(child.parts.attributes)
          .map(([attribute, index]) => `${attribute}=${index}`)
          .join(',')

        if (attributeBindings) {
          element.append(new Comment(`attribute-parts ${attributeBindings}`))
        }
      }

      element.append(child)
    }
  }

  return element
}
