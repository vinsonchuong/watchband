import camelCase from 'camelcase'
import {fromEvent} from 'rxjs'
import {makeHtml, makeCss} from '../html/index.js'
import {isSignal, effect} from '../signal/index.js'
import {isObservable} from '../observable/index.js'
import {NodePart} from '../html/create-element/dom-parts/index.js'
import {chain} from '../strategy/index.js'
import {createElement} from '../html/html.js'

const baseWebComponentLookup = new WeakMap()

export function render(Component, element) {
  const document = element.ownerDocument
  const window = document.defaultView

  registerComponent(window, Component)

  if (element.getElementsByTagName(Component.tagName).length === 0) {
    element.append(document.createElement(Component.tagName))
  }
}

export function registerComponent(window, Component) {
  const {BaseWebComponent, html, css} = makeBaseWebComponent(window)

  class WebComponent extends BaseWebComponent {
    static instances = new Set()
    static Component = Component
    component = new this.constructor.Component()
    static styles = makeTemplate(css, Component.styles)
    template = this.ssr
      ? hydrateTemplate(this, this.component.template)
      : makeTemplate(html, this.component.template)
  }

  window.customElements.define(Component.tagName, WebComponent)

  return WebComponent
}

export function makeTemplate(fn, template) {
  return template ? fn(template.strings, ...template.values) : null
}

function hydrateTemplate(webComponent, template) {
  const hooks = []
  const shadowRoot = webComponent.internals.shadowRoot
  const element = shadowRoot.children[0]
  const elementsWithBindings = shadowRoot.querySelectorAll('[data-wb]')

  for (const elementWithBinding of elementsWithBindings) {
    const bindings = elementWithBinding.dataset.wb.split(',')
    for (const binding of bindings) {
      const [, sourceMatch, bindingType, targetMatch] =
        binding.match(/^(\d+)([:<>])(.+)$/)
      const sourceIndex = Number(sourceMatch)
      const source = template.values[sourceIndex]

      if (bindingType === ':') {
        // Attribute
        const attributeName = targetMatch
        const hook = {
          connect() {
            this.disconnect = effect(() => {
              elementWithBinding.setAttribute(attributeName, source.get())
            })
          },
        }
        hook.connect()
        hooks.push(hook)
      } else if (bindingType === '<') {
        // Event
        const eventName = targetMatch
        const observable = fromEvent(elementWithBinding, eventName)
        const hook = {
          connect() {
            const subscription = observable.subscribe(source)
            this.disconnect = () => {
              subscription.unsubscribe()
            }
          },
        }
        hook.connect()
        hooks.push(hook)
      } else {
        // Child
        const childIndex = Number(targetMatch)
        const node = elementWithBinding.childNodes[childIndex]
        const part = new NodePart(node)
        const hook = {
          connect() {
            this.disconnect = effect(() => {
              part.value = source.get()
            })
          },
        }
        hook.connect()
        hooks.push(hook)
      }
    }
  }

  return {
    element,
    connect() {
      for (const hook of hooks) {
        hook.connect()
      }
    },
    disconnect() {
      for (const hook of hooks) {
        hook.disconnect()
      }
    },
  }
}

export function makeBaseWebComponent(window) {
  if (baseWebComponentLookup.has(window)) {
    return baseWebComponentLookup.get(window)
  }

  const html = makeHtml(
    window,
    chain(
      (next) => (context, tag, attributes, children) => {
        if (tag?.tagName) {
          registerComponent(window, tag)
          return next(context, tag.tagName, attributes, children)
        }

        return next(context, tag, attributes, children)
      },
      createElement,
    ),
  )

  const css = makeCss(window)

  class BaseWebComponent extends window.HTMLElement {
    ssr = false
    disconnected = false
    internals

    constructor() {
      super()
      this.internals = this.attachInternals()
      if (this.internals.shadowRoot) {
        this.ssr = true
      } else {
        this.attachShadow({mode: 'open', serializable: true})
      }
    }

    connectedCallback() {
      const shadowRoot = this.internals.shadowRoot

      if (
        this.constructor.styles &&
        shadowRoot.adoptedStyleSheets.length === 0
      ) {
        shadowRoot.adoptedStyleSheets.push(this.constructor.styles)
      }

      if (this.template) {
        if (shadowRoot.children.length === 0) {
          shadowRoot.append(this.template.element)
        } else if (this.disconnected) {
          this.template.connect()
          this.disconnected = false
        }
      }

      if (isObservable(this.component.events)) {
        this.component.events.subscribe(({type, detail}) => {
          this.dispatchEvent(
            new window.CustomEvent(type, {
              detail,
              bubbles: true,
              composed: true,
            }),
          )
        })
      }

      if (isSignal(this.component.connected)) {
        this.component.connected.set(true)
      }
    }

    disconnectedCallback() {
      if (isSignal(this.component.connected)) {
        this.component.connected.set(false)
      }

      this.template.disconnect()
      this.disconnected = true
    }

    static get observedAttributes() {
      return this.Component.attributes
    }

    attributeChangedCallback(name, oldValue, newValue) {
      const propertyName = camelCase(name)
      const property = this.component[propertyName]

      if (isSignal(property)) {
        property.set(newValue)
      }
    }

    setAttribute(name, value) {
      if (typeof value === 'string') {
        super.setAttribute(name, value)
      } else {
        this.attributeChangedCallback(name, null, value)
      }
    }
  }

  baseWebComponentLookup.set(window, {BaseWebComponent, html, css})

  return {BaseWebComponent, html, css}
}
