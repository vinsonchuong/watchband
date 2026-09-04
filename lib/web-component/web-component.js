import {effect, isSignal} from '../signal/index.js'
import {makeRender, renderStyles, serializeStyles} from '../html/index.js'

export function registerComponent(window, Component) {
  if (window.customElements.get(Component.tagName)) {
    return
  }

  const BaseWebComponent = getBaseWebComponent(window)

  class WebComponent extends BaseWebComponent {
    static Component = Component
  }

  window.customElements.define(Component.tagName, WebComponent)
}

const capturedContextEvents = new Set()

// TODO: Compose with html#capature
export function captureContext(window) {
  window.addEventListener('context-request', (event) => {
    capturedContextEvents.add({
      event,
      composedPath: event.composedPath(),
    })
  })
}

const baseWebComponents = new WeakMap()

function getBaseWebComponent(window) {
  if (baseWebComponents.has(window)) {
    return baseWebComponents.get(window)
  }

  const {render, resume} = makeRender(window)

  class BaseWebComponent extends window.HTMLElement {
    static get observedAttributes() {
      return this.Component.attributes
    }

    #firstConnect = true
    onDisconnected = []

    constructor() {
      super()
      this.internals = this.attachInternals()

      const WebComponent = this.constructor
      const Component = WebComponent.Component
      this.component = new Component(this)

      for (const property of Component.properties) {
        const signal = this.component.metadata.properties[property]
        Object.defineProperty(this, property, {
          get() {
            return signal.get()
          },
          set(value) {
            signal.set(value)
          },
        })
      }

      const isExistingShadowRoot = Boolean(this.shadowRoot)

      if (!isExistingShadowRoot) {
        this.attachShadow({
          mode: 'open',
          serializable: true,
          clonable: true,
        })
      }

      const {shadowRoot} = this

      shadowRoot.addEventListener('context-request', (event) => {
        const {context, callback} = event.detail

        const signal = this.component.metadata.context.provider[context]

        if (signal) {
          event.stopImmediatePropagation()
          callback(signal)
        }
      })

      if (isExistingShadowRoot) {
        for (const entry of capturedContextEvents) {
          const {event, composedPath} = entry
          if (composedPath.includes(shadowRoot)) {
            composedPath[0].dispatchEvent(event)
          }
        }
      }

      if (isExistingShadowRoot) {
        if (this.component.template) {
          resume(this.component.template, shadowRoot)
        }

        const styleElement = shadowRoot.querySelector('style[data-instance]')
        if (isSignal(this.component.styles) && styleElement) {
          effect(() => {
            const styles = this.component.styles.get()
            styleElement.textContent = serializeStyles(styles)
          })
        }
      } else {
        if (this.component.template) {
          const {fragment} = render(this.component.template)
          shadowRoot.append(fragment)
        }

        if (shadowRoot.adoptedStyleSheets) {
          if (!WebComponent.styles && Component.styles) {
            WebComponent.styles = renderStyles(window, Component.styles)
          }

          if (WebComponent.styles) {
            shadowRoot.adoptedStyleSheets.push(WebComponent.styles)
          }

          if (isSignal(this.component.styles)) {
            effect(() => {
              const styles = this.component.styles.get()
              if (this.styles) {
                this.styles.replace(serializeStyles(styles))
                shadowRoot.adoptedStyleSheets.push(this.styles)
              } else {
                this.styles = renderStyles(window, styles)
              }
            })
          }
        } else {
          if (isSignal(this.component.styles)) {
            effect(() => {
              const styles = this.component.styles.get()
              if (this.styles) {
                this.styles.innerHTML = serializeStyles(styles)
              } else {
                this.styles = window.document.createElement('style')
                this.styles.innerHTML = serializeStyles(styles)
                this.styles.dataset.instance = ''
                shadowRoot.prepend(this.styles)
              }
            })
          }

          if (!WebComponent.styles && Component.styles) {
            WebComponent.styles = serializeStyles(Component.styles)
          }

          if (WebComponent.styles) {
            const style = window.document.createElement('style')
            style.innerHTML = WebComponent.styles
            shadowRoot.prepend(style)
          }
        }
      }
    }

    #requestContext(key, signal) {
      this.dispatchEvent(
        new window.CustomEvent('context-request', {
          bubbles: true,
          composed: true,
          detail: {
            context: key,
            callback(upstreamSignal) {
              effect(() => {
                signal.set(upstreamSignal.get())
              })
            },
          },
        }),
      )
    }

    connectedCallback() {
      if (this.#firstConnect) {
        for (const [
          key,
          signal,
        ] of this.component.metadata.context.consumer.entries()) {
          if (isSignal(key)) {
            effect(() => {
              const keyString = key.get()
              if (keyString) {
                this.#requestContext(keyString, signal)
              }
            })
          } else {
            this.#requestContext(key, signal)
          }
        }
      }

      for (const [type, subject] of Object.entries(
        this.component.metadata.globalEvents.window,
      )) {
        const listener = (event) => {
          subject.next(event)
        }

        window.addEventListener(type, listener)

        this.onDisconnected.push(() => {
          window.removeEventListener(type, listener)
        })
      }

      for (const [type, subject] of Object.entries(
        this.component.metadata.globalEvents.document,
      )) {
        const listener = (event) => {
          subject.next(event)
        }

        window.document.addEventListener(type, listener)

        this.onDisconnected.push(() => {
          window.removeEventListener(type, listener)
        })
      }

      if (this.#firstConnect) {
        this.component.afterRender?.()
        this.#firstConnect = false
      }
    }

    disconnectedCallback() {
      for (const callback of this.onDisconnected) {
        callback()
      }

      this.onDisconnected = []
    }

    connectedMoveCallback() {}

    attributeChangedCallback(name, oldValue, newValue) {
      const signal = this.component.metadata.attributes[name]

      if (signal) {
        signal.set(newValue)
      }
    }
  }

  baseWebComponents.set(window, BaseWebComponent)

  return BaseWebComponent
}
