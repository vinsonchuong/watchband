import {JSDOM} from 'jsdom'
import CleanCss from 'clean-css'
import {makeHtml} from '../html/index.js'
import {isSignal} from '../signal/index.js'
import {createElement} from '../html/html.js'
import {chain} from '../strategy/index.js'
import {makeBaseWebComponent, makeTemplate} from './web-component.js'

const cleanCss = new CleanCss()

export function render(
  Component,
  {components = [], html = '<!doctype html>'} = {},
) {
  const jsdom = new JSDOM(html)
  const {window} = jsdom
  const {document} = window

  registerComponent(window, Component)
  for (const Component of components) {
    registerComponent(window, Component)
  }

  document.body.append(document.createElement(Component.tagName))

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
  const {BaseWebComponent} = makeBaseWebComponent(window)

  function html(strings, ...values) {
    const valueIndexMap = new Map()
    for (const [index, value] of values.entries()) {
      valueIndexMap.set(value, index)
    }

    const baseHtml = makeHtml(
      window,
      chain(
        (next) => (context, tag, attributes, children) => {
          const bindings = []
          const resultAttributes = {...attributes}

          if (tag?.tagName) {
            registerComponent(window, tag)
            tag = tag.tagName
          }

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
    )

    return baseHtml(strings, ...values)
  }

  class WebComponent extends BaseWebComponent {
    static instances = new Set()
    static Component = Component
    component = new this.constructor.Component()
    static stylesText = makeTemplate(serverCss, Component.styles)
    template = makeTemplate(html, this.component.template)

    connectedCallback() {
      super.connectedCallback()

      const template = window.document.createElement('template')
      template.setAttribute('shadowrootmode', 'open')

      if (this.constructor.stylesText) {
        const style = window.document.createElement('style')
        style.innerHTML = cleanCss.minify(this.constructor.stylesText).styles
        template.innerHTML += style.outerHTML
      }

      if (this.template) {
        template.innerHTML += this.template.element.outerHTML
      }

      this.prepend(template)
    }

    attributeChangedCallback(name, oldValue, newValue) {
      super.attributeChangedCallback(name, oldValue, newValue)
    }
  }

  window.customElements.define(Component.tagName, WebComponent)

  return WebComponent
}
