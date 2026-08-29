import htm from 'htm/mini'
import {isSignal} from '../signal/index.js'
import {isObserver} from '../observable/index.js'
import {
  AttributePart as BaseAttributePart,
  ChildNodePart as BaseChildNodePart,
  EventPart as BaseEventPart,
} from './dom-parts.js'
import {HtmlTemplate} from './template.js'

const partPattern = /^\{(?<name>\w+)\}$/v

function parsePart(value) {
  return typeof value === 'string' ? partPattern.exec(value) : null
}

function parseTemplateValues(values) {
  return values.map((value, index) =>
    typeof value === 'string' ? value : {index, value},
  )
}

function createElement(tag, attributes, ...children) {
  const {
    window,
    AttributePart,
    EventPart,
    ChildNodePart,
    render,
    parts,
    templates,
  } = this
  const element = window.document.createElement(tag)

  for (const [attributeName, attributeValue] of Object.entries(
    attributes ?? {},
  )) {
    const parsedPart = parsePart(attributeValue)

    if (parsedPart) {
      const partName = parsedPart.groups.name
      const part = attributeName.startsWith('on:')
        ? new EventPart(element, attributeName.slice(3))
        : new AttributePart(element, attributeName)
      parts[partName] = part
    } else if (isSignal(attributeValue?.value)) {
      const part = new AttributePart(element, attributeName)
      part.bind(attributeValue.value)
      parts.push(part)
    } else if (
      attributeName.startsWith('on:') &&
      isObserver(attributeValue?.value)
    ) {
      const part = new EventPart(element, attributeName.slice(3))
      part.bind(attributeValue.value)
      parts.push(part)
    } else {
      const part = new AttributePart(element, attributeName)
      part.value =
        typeof attributeValue === 'boolean'
          ? ''
          : (attributeValue?.value ?? attributeValue)
    }
  }

  // TODO: Look into nesting templates that have parts.
  //   Also, the flatMap is dubious
  //   What if I restrict arrays to only allow templates?
  for (const child of children.flatMap((c) =>
    Array.isArray(c?.value) ? c.value.map((v) => ({value: v})) : c,
  )) {
    const parsedPart = parsePart(child)
    if (parsedPart) {
      const partName = parsedPart.groups.name
      const part = new ChildNodePart(element, element.lastChild, null)
      parts[partName] = part
    } else if (isSignal(child?.value)) {
      const part = new ChildNodePart(element, element.lastChild, null)
      part.bind(child.value)
      parts.push(part)
    } else if (child.value instanceof HtmlTemplate) {
      const result = render(child.value)
      result.fragment.firstChild.data += ` ${child.index}`
      element.append(result.fragment)
      templates.push({parts: result.parts, templates: result.templates})
    } else if (typeof child === 'string' || child instanceof window.Node) {
      element.append(child)
    } else if (child.value instanceof window.Node) {
      element.append(child.value)
    }
  }

  return element
}

const cache = new WeakMap()

export function makeRender(
  window,
  {AttributePart = BaseAttributePart, ChildNodePart = BaseChildNodePart} = {},
) {
  if (cache.has(window)) {
    return cache.get(window)
  }

  class AttributePartWithContext extends AttributePart {
    static render = render
  }
  class ChildNodePartWithContext extends ChildNodePart {
    static render = render
  }

  function render(template) {
    const parts = []
    const templates = []

    const context = {
      window,
      render,
      AttributePart: AttributePartWithContext,
      EventPart: BaseEventPart,
      ChildNodePart: ChildNodePartWithContext,
      parts,
      templates,
    }

    const {document} = window

    const parse = htm.bind(createElement.bind(context))

    const elementOrElements = parse(
      template.strings,
      ...parseTemplateValues(template.values),
    )
    const elements = Array.isArray(elementOrElements)
      ? elementOrElements
      : [elementOrElements]

    const fragment = document.createDocumentFragment()
    const templateStart = document.createComment('template')
    const templateEnd = document.createComment('/template')
    fragment.append(templateStart, ...elements, templateEnd)

    const attributePartKeys = Object.keys(parts).filter(
      (key) =>
        parts[key] instanceof AttributePartWithContext ||
        parts[key] instanceof BaseEventPart,
    )
    const attributePartGroups = Map.groupBy(
      attributePartKeys,
      (key) => parts[key].element,
    )
    for (const [element, keys] of attributePartGroups.entries()) {
      element.before(
        document.createComment(
          `attribute-parts ${keys.map((key) => `${parts[key].attribute}=${key}`).join(',')}`,
        ),
      )
    }

    const childNodePartKeys = Object.keys(parts).filter(
      (key) => parts[key] instanceof ChildNodePartWithContext,
    )
    for (const key of childNodePartKeys) {
      const part = parts[key]
      part.startSentinelNode.data += ` ${key}`
    }

    // TODO: Expose non-named parts for cleanup?
    return {
      fragment,
      parts,
      templates,
    }
  }

  class ChildNodePartWithContextAndResume extends ChildNodePartWithContext {
    constructor(startSentinelNode, endSentinelNode) {
      super(
        startSentinelNode.parentElement,
        startSentinelNode.previousSibling,
        endSentinelNode.nextSibling,
      )
      this.startSentinelNode = startSentinelNode
      this.endSentinelNode = endSentinelNode
    }

    addSentinelNodes() {}
  }

  const capturedEvents = new WeakMap()
  const resumedElements = new WeakSet()

  function capture() {
    const events = new Set()
    const roots = new Set()

    function findRoots(root) {
      const walker = window.document.createTreeWalker(
        root,
        window.NodeFilter.SHOW_ELEMENT,
      )

      let currentElement = walker.nextNode()
      while (currentElement) {
        const shadowRoot = currentElement.shadowRoot
        if (shadowRoot) {
          roots.add(shadowRoot)
        }

        currentElement = walker.nextNode()
      }
    }

    roots.add(window.document.body)
    roots.forEach(findRoots)

    for (const root of roots) {
      const walker = window.document.createTreeWalker(
        root,
        window.NodeFilter.SHOW_COMMENT,
      )

      let currentCommentNode = walker.nextNode()
      while (currentCommentNode !== null) {
        const directive = currentCommentNode.data
        if (directive.startsWith('attribute-parts ')) {
          const bindings = directive
            .slice(16)
            .split(',')
            .map((binding) => binding.split('='))

          for (const [name] of bindings) {
            if (name.startsWith('on:')) {
              events.add(name.slice(3))
            }
          }
        }

        currentCommentNode = walker.nextNode()
      }
    }

    for (const type of events) {
      const listener = (event) => {
        const target = event.composedPath()[0]
        if (resumedElements.has(target)) {
          return
        }

        if (capturedEvents.has(target)) {
          capturedEvents.get(target).push(event)
        } else {
          capturedEvents.set(target, [event])
        }
      }

      window.document.addEventListener(type, listener, {
        capture: true,
        passive: true,
      })
    }
  }

  function resume(template, element) {
    const walker = window.document.createTreeWalker(
      element,
      window.NodeFilter.SHOW_COMMENT,
    )

    const parsedValues = parseTemplateValues(template.values).filter(
      (v) => typeof v !== 'string',
    )
    const parts = []

    let currentCommentNode = walker.nextNode()
    while (currentCommentNode !== null) {
      const directive = currentCommentNode.data

      if (directive.startsWith('attribute-parts ')) {
        const attributePartElement = currentCommentNode.nextSibling
        resumedElements.add(attributePartElement)

        const bindings = directive
          .slice(16)
          .split(',')
          .map((item) => item.split('='))

        for (const [attributeName, valueIndex] of bindings) {
          const attributeValue = parsedValues[valueIndex].value

          if (attributeName.startsWith('on:')) {
            const eventType = attributeName.slice(3)

            const part = new BaseEventPart(attributePartElement, eventType)

            part.bind(attributeValue)
            parts.push(part)

            const events = capturedEvents.get(attributePartElement) ?? []
            for (const event of events) {
              if (event.type === eventType) {
                attributePartElement.dispatchEvent(event)
              }
            }
          } else {
            const part = new AttributePartWithContext(
              attributePartElement,
              attributeName,
            )
            part.bind(attributeValue)
            parts.push(part)
          }
        }
      } else if (directive.startsWith('child-node-part')) {
        const startCommentNode = currentCommentNode

        let count = 1
        while (count > 0) {
          currentCommentNode = walker.nextNode()

          const laterDirective = currentCommentNode.data
          if (laterDirective.startsWith('child-node-part')) {
            count += 1
          } else if (laterDirective.startsWith('/child-node-part')) {
            count -= 1
          }
        }

        const valueIndex = startCommentNode.data.slice(16)

        const part = new ChildNodePartWithContextAndResume(
          startCommentNode,
          currentCommentNode,
        )
        part.bind(parsedValues[valueIndex].value)
        parts.push(part)
      } else if (directive.startsWith('template') && directive.length > 8) {
        // TODO: how to resume templates in a signal?
        const valueIndex = directive.slice(9)
        const directiveTemplate = parsedValues[valueIndex].value

        resume(directiveTemplate, currentCommentNode.nextSibling)

        let count = 1
        while (count > 0) {
          currentCommentNode = walker.nextNode()

          const currentDirective = currentCommentNode.data
          if (currentDirective.startsWith('template')) {
            count += 1
          } else if (currentDirective.startsWith('/template')) {
            count -= 1
          }
        }
      }

      currentCommentNode = walker.nextNode()
    }
  }

  const renderer = {render, capture, resume}
  cache.set(window, renderer)
  return renderer
}
