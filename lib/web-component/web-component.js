import camelCase from 'camelcase'
import {fromEvent} from 'rxjs'
import {Signal} from 'signal-polyfill'
import {isSignal, effect} from '../signal/index.js'
import {isObservable} from '../observable/index.js'
import {NodePart} from '../html/create-element/dom-parts/index.js'
import {chain} from '../strategy/index.js'
import {
  createElement,
  createFragment,
  makeRender,
} from '../html/template/index.js'

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
  if (window.customElements.get(Component.tagName)) {
    return
  }

  const {BaseWebComponent, render} = makeBaseWebComponent(window)

  class WebComponent extends BaseWebComponent {
    static formAssociated = Component.formControl
    static instances = new Set()
    static Component = Component
    component = new this.constructor.Component(this)
    static styles = Component.styles ? render(Component.styles) : null
    template = this.ssr
      ? hydrateTemplate(this, this.component.template)
      : render(this.component.template)
  }

  window.customElements.define(Component.tagName, WebComponent)

  return WebComponent
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

export const createElementPlugins = [
  (next) => (context, tag, attributes, children) => {
    if (tag?.tagName) {
      registerComponent(context.window, tag)
      return next(context, tag.tagName, attributes, children)
    }

    return next(context, tag, attributes, children)
  },
]

export function makeBaseWebComponent(
  window,
  {
    createElementStrategy = chain(...createElementPlugins, createElement),
    createFragmentStrategy = chain(createFragment),
  } = {},
) {
  if (baseWebComponentLookup.has(window)) {
    return baseWebComponentLookup.get(window)
  }

  const render = makeRender(window, {
    createElementStrategy,
    createFragmentStrategy,
  })

  class BaseWebComponent extends window.HTMLElement {
    ssr = false
    disconnected = false
    internals
    #disconnectHooks = []

    constructor() {
      super()
      this.internals = this.attachInternals()
      if (this.internals.shadowRoot) {
        this.ssr = true
      } else {
        this.attachShadow({mode: 'open', serializable: true, clonable: true})
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
        const subscription = this.component.events.subscribe(
          ({type, detail}) => {
            this.dispatchEvent(
              new window.CustomEvent(type, {
                detail,
                bubbles: true,
                composed: true,
              }),
            )
          },
        )
        this.#disconnectHooks.push(() => {
          subscription.unsubscribe()
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

      for (const hook of this.#disconnectHooks) {
        hook()
      }

      this.#disconnectHooks = []

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
        const isBoolean =
          typeof Signal.subtle.untrack(() => property.get()) === 'boolean'

        if (isBoolean) {
          const parsedValue =
            !Object.is(newValue, undefined) && !Object.is(newValue, null)
          property.set(parsedValue)
        } else {
          property.set(newValue)
        }
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

  baseWebComponentLookup.set(window, {BaseWebComponent, render})

  return {BaseWebComponent, render}
}
