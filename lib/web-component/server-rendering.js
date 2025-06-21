import {JSDOM} from 'jsdom'
import SymbolTree from 'symbol-tree'
import CleanCss from 'clean-css'
import {isSignal, State} from '../signal/index.js'
import {createElement} from '../html/template/index.js'
import {chain} from '../strategy/index.js'
import {makeBaseWebComponent} from './web-component.js'

const cleanCss = new CleanCss()

export function render(
  Component,
  {components = [], html = '<!doctype html>', dependencies = () => {}} = {},
) {
  const jsdom = new JSDOM(html)
  const {window} = jsdom
  const {document} = window

  const componentTree = new SymbolTree()
  window.componentTree = componentTree
  componentTree.initialize(document)

  registerComponent(window, Component)
  for (const Component of components) {
    registerComponent(window, Component)
  }

  const contextRequests = []
  document.body.addEventListener('context-request', (event) => {
    contextRequests.push(event.detail)
  })

  document.body.append(document.createElement(Component.tagName))

  while (contextRequests.length > 0) {
    const {key, callback} = contextRequests.shift()
    const result = dependencies(key)
    callback(new State(result))
  }

  const webComponents = Array.from(componentTree.treeIterator(document))
  while (webComponents.length > 1) {
    const webComponent = webComponents.pop()
    const template = document.createElement('template')
    template.setAttribute('shadowrootmode', 'open')

    if (webComponent.template) {
      template.innerHTML = webComponent.internals.shadowRoot.innerHTML
    }

    if (webComponent.constructor.stylesText) {
      const style = window.document.createElement('style')
      style.innerHTML = cleanCss.minify(
        webComponent.constructor.stylesText,
      ).styles
      template.content.prepend(style)
    }

    webComponent.prepend(template)
  }

  return jsdom.serialize()
}

function serverCss(strings, ...values) {
  const styles = strings.reduce(
    (result, string, i) => result + string + (values[i] ?? ''),
    '',
  )

  return styles
}

function registerComponent(window, Component) {
  const {BaseWebComponent, render} = makeBaseWebComponent(window, {
    createElementStrategy: chain(
      (next) => (context, tag, attributes, children) => {
        if (tag?.tagName) {
          registerComponent(window, tag)
          return next(context, tag.tagName, attributes, children)
        }

        return next(context, tag, attributes, children)
      },
      (next) =>
        (context, ...otherArgs) => {
          const valueIndexMap = new Map()
          for (const [index, value] of context.template.values.entries()) {
            valueIndexMap.set(value, index)
          }

          return next({...context, valueIndexMap}, ...otherArgs)
        },
      (next) => (context, tag, attributes, children) => {
        const {valueIndexMap} = context
        const bindings = []
        const resultAttributes = {...attributes}

        for (const [name, value] of Object.entries(attributes)) {
          if (isSignal(value)) {
            const signalIndex = valueIndexMap.get(value)
            bindings.push(`${signalIndex}:${name}`)
          }

          if (name.startsWith('on:')) {
            delete resultAttributes[name]

            const observableIndex = valueIndexMap.get(value)
            const eventName = name.slice(3)
            bindings.push(`${observableIndex}<${eventName}`)
          }
        }

        for (const [childIndex, child] of Object.entries(children)) {
          if (isSignal(child)) {
            const signalIndex = valueIndexMap.get(child)
            bindings.push(`${signalIndex}>${childIndex}`)
          }
        }

        if (bindings.length > 0) {
          resultAttributes['data-wb'] = bindings.join(',')
        }

        return next(context, tag, resultAttributes, children)
      },
      createElement,
    ),
  })

  class WebComponent extends BaseWebComponent {
    static instances = new Set()
    static Component = Component
    component = new this.constructor.Component()
    static stylesText = Component.styles
      ? serverCss(Component.styles.strings, ...Component.styles.values)
      : null
    template = render(this.component.template)

    connectedCallback() {
      super.connectedCallback()
      const rootNode = this.getRootNode()
      window.componentTree.appendChild(rootNode.host ?? rootNode, this)
    }
  }

  window.customElements.define(Component.tagName, WebComponent)

  return WebComponent
}
