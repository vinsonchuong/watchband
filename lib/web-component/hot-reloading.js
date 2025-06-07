import {makeBaseWebComponent} from './web-component.js'

export function registerComponent(window, Component) {
  const {BaseWebComponent, render} = makeBaseWebComponent(window)

  class WebComponent extends BaseWebComponent {
    static instances = new Set()
    static Component = Component
    component = new this.constructor.Component()
    static styles = Component.styles && render(Component.styles)
    template = this.component.template && render(this.component.template)

    static replaceComponent(NewComponent) {
      this.Component = NewComponent
      this.styles = NewComponent.styles && render(NewComponent.styles)

      for (const instance of Array.from(this.instances)) {
        instance.replaceComponent(NewComponent)
      }
    }

    replaceComponent(NewComponent) {
      this.disconnectedCallback()

      this.component = new NewComponent()

      this.internals.shadowRoot.adoptedStylesheets = []

      this.template.element.remove()
      this.template = this.component.template && render(this.component.template)

      for (const attribute of NewComponent.attributes) {
        this.attributeChangedCallback(
          attribute,
          null,
          this.getAttribute(attribute),
        )
      }

      this.connectedCallback()
    }

    connectedCallback() {
      this.constructor.instances.add(this)

      if (
        this.component &&
        !(this.component instanceof this.constructor.Component)
      ) {
        this.replaceComponent(this.constructor.Component)
      }

      super.connectedCallback()
    }

    disconnectedCallback() {
      super.disconnectedCallback()
      this.constructor.instances.delete(this)
    }
  }

  window.customElements.define(Component.tagName, WebComponent)

  return WebComponent
}
