import test from 'ava'
import {JSDOM} from 'jsdom'
import {merge, map, scan} from 'rxjs'
import {Computed, State} from '../signal/index.js'
import {Component as BaseComponent} from './component.js'
import {registerComponent, html, render} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('making a component that renders static content', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-hello'
    template = html`<p>Hello World!</p>`
  }

  render(Component, window.document.body)

  const component = window.document.querySelector('wc-hello')
  t.is(component.shadowRoot.textContent, 'Hello World!')
})

test('making a component that renders dynamic content', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-hello'
    static attributes = ['message']
    message = new State('')
    template = html`<p>${this.message}</p>`
  }

  registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-hello message="Hello World!"></wc-hello>
  `

  const component = window.document.querySelector('wc-hello')
  t.is(component.shadowRoot.textContent, 'Hello World!')

  component.setAttribute('message', 'Something Else!')
  t.is(component.shadowRoot.textContent, 'Something Else!')
})

test('making a component that reacts to events', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-counter'
    static attributes = []
    count = new State(0)
    template = html`
      <div>
        <p>${this.count}</p>
        <button
          on:click=${() => {
            this.count.set(this.count.get() + 1)
          }}
        >
          Increment
        </button>
        <button
          on:click=${() => {
            this.count.set(this.count.get() - 1)
          }}
        >
          Decrement
        </button>
      </div>
    `
  }

  registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-counter message="Hello World!"></wc-counter>
  `

  const component = window.document.querySelector('wc-counter')
  t.is(component.shadowRoot.querySelector('p').textContent, '0')

  component.shadowRoot.querySelector('button:nth-child(2)').click()
  t.is(component.shadowRoot.querySelector('p').textContent, '1')

  component.shadowRoot.querySelector('button:nth-child(2)').click()
  t.is(component.shadowRoot.querySelector('p').textContent, '2')

  component.shadowRoot.querySelector('button:nth-child(3)').click()
  t.is(component.shadowRoot.querySelector('p').textContent, '1')
})

test('making a component that emits events', (t) => {
  const {window} = t.context

  class Component extends BaseComponent {
    static tagName = 'wc-counter'
    static attributes = []
    increments = this.event('increment')
    decrements = this.event('decrement')
    counts = this.event(
      'count',
      merge(
        this.increments.pipe(map(() => +1)),
        this.decrements.pipe(map(() => -1)),
      ).pipe(scan((count, op) => count + op, 0)),
    )
    template = html`
      <div>
        <button on:click=${this.increments}>Increment</button>
        <button on:click=${this.decrements}>Decrement</button>
      </div>
    `
  }

  registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-counter message="Hello World!"></wc-counter>
  `

  const component = window.document.querySelector('wc-counter')

  const increments = []
  component.addEventListener('increment', (event) => {
    increments.push(event)
  })

  const decrements = []
  component.addEventListener('decrement', (event) => {
    decrements.push(event)
  })

  const counts = []
  component.addEventListener('count', (event) => {
    counts.push(event)
  })

  t.is(increments.length, 0)
  t.is(decrements.length, 0)
  t.is(counts.length, 0)

  component.shadowRoot.querySelector('button:nth-child(1)').click()
  t.is(increments.length, 1)
  t.is(decrements.length, 0)
  t.is(counts[0].detail, 1)

  component.shadowRoot.querySelector('button:nth-child(1)').click()
  t.is(increments.length, 2)
  t.is(decrements.length, 0)
  t.is(counts[1].detail, 2)

  component.shadowRoot.querySelector('button:nth-child(2)').click()
  t.is(increments.length, 2)
  t.is(decrements.length, 1)
  t.is(counts[2].detail, 1)
})

test('propagating complex data between components', (t) => {
  const {window} = t.context

  class Parent {
    static tagName = 'wc-parent'
    static attributes = ['data']
    data = new State(null)
    template = html`<wc-child data=${this.data}></wc-child>`
  }
  registerComponent(window, Parent)

  class Child {
    static tagName = 'wc-child'
    static attributes = ['data']
    data = new State(null)
    message = new Computed(() => {
      return this.data.get()?.message ?? ''
    })
    template = html`<p>${this.message}</p>`
  }
  registerComponent(window, Child)

  window.document.body.innerHTML = '<wc-parent></wc-parent>'

  const parent = window.document.querySelector('wc-parent')
  const child = parent.shadowRoot.querySelector('wc-child')

  t.is(child.shadowRoot.textContent, '')

  parent.setAttribute('data', {message: 'Hello World!'})
  t.is(child.shadowRoot.textContent, 'Hello World!')

  parent.setAttribute('data', {message: 'Something Else!'})
  t.is(child.shadowRoot.textContent, 'Something Else!')
})

test('rendering component classes directly', (t) => {
  const {window} = t.context

  class ParentComponent {
    static tagName = 'wc-parent'
    template = html`<${ChildComponent}><//>`
  }

  class ChildComponent {
    static tagName = 'wc-child'
    template = html`<p>Hello World!</p>`
  }

  render(ParentComponent, window.document.body)

  const parentComponent = window.document.querySelector('wc-parent')
  const childComponent = parentComponent.shadowRoot.querySelector('wc-child')
  t.is(childComponent.shadowRoot.querySelector('p').textContent, 'Hello World!')
})

test('rendering a component that renders a list of templates', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-component'
    config = ['One', 'Two', 'Three']
    template = html`${this.config.map((message) => html`<p>${message}</p>`)}`
  }

  render(Component, window.document.body)

  const component = window.document.querySelector('wc-component')

  t.is(component.shadowRoot.children[0].textContent, 'One')
  t.is(component.shadowRoot.children[1].textContent, 'Two')
  t.is(component.shadowRoot.children[2].textContent, 'Three')
})

test('rendering a component that renders a dynamic list of templates', (t) => {
  const {window} = t.context

  const templateMap = new Map()

  class List extends BaseComponent {
    static tagName = 'wc-list'
    messages = new State(['One', 'Two'])
    template = html`${new Computed(() =>
      this.messages.get().map((message) => {
        if (templateMap.has(message)) {
          return templateMap.get(message)
        }

        const template = html`<${Item} message=${message} />`
        templateMap.set(message, template)
        return template
      }),
    )}`
  }

  class Item extends BaseComponent {
    static tagName = 'wc-item'
    static attributes = ['message']
    message = new State('')
    template = html`<p>${this.message}</p>`
  }

  render(List, window.document.body)

  const list = window.document.querySelector('wc-list')

  t.is(list.shadowRoot.children.length, 2)
  t.is(list.shadowRoot.children[0].shadowRoot.textContent, 'One')
  t.is(list.shadowRoot.children[1].shadowRoot.textContent, 'Two')

  list.component.messages.set(['One', 'Two', 'Three'])

  t.is(list.shadowRoot.children.length, 3)
  t.is(list.shadowRoot.children[0].shadowRoot.textContent, 'One')
  t.is(list.shadowRoot.children[1].shadowRoot.textContent, 'Two')
  t.is(list.shadowRoot.children[2].shadowRoot.textContent, 'Three')
})

test('rendering a component that conditionally renders templates', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-component'
    cond = new State(false)
    template = html`
      ${new Computed(() =>
        this.cond.get() ? html`<p>True</p>` : html`<p>False</p>`,
      )}
    `
  }

  render(Component, window.document.body)

  const component = window.document.querySelector('wc-component')

  t.is(component.shadowRoot.textContent, 'False')
})

test('knowing when a web component is attached to the DOM', (t) => {
  const {window} = t.context

  class Component extends BaseComponent {
    static tagName = 'wc-component'
    message = new Computed(() =>
      this.connected.get() ? 'Connected' : 'Not Connected',
    )
    template = html`<div>${this.message}</div>`
  }

  render(Component, window.document.body)

  const component = window.document.querySelector('wc-component')
  t.is(component.shadowRoot.textContent, 'Connected')

  component.remove()
  t.is(component.shadowRoot.textContent, 'Not Connected')
})

test('requesting context dependencies', (t) => {
  const {window} = t.context

  class Component extends BaseComponent {
    static tagName = 'wc-component'
    message = this.ask('message')
    template = html`<div>${this.message}</div>`
  }

  const message = new State('Hello World!')

  window.document.body.addEventListener('context-request', (event) => {
    const {key, callback} = event.detail
    if (key === 'message') {
      callback(message)
    }
  })

  render(Component, window.document.body)
  const component = window.document.querySelector('wc-component')

  t.is(component.shadowRoot.textContent, 'Hello World!')

  message.set('Another Message!')
  t.is(component.shadowRoot.textContent, 'Another Message!')
})

test('requesting context dependencies based on an attribute', (t) => {
  const {window} = t.context

  class Component extends BaseComponent {
    static tagName = 'wc-component'
    static attributes = ['id']
    id = new State(null)
    record = this.ask(
      new Computed(() => {
        const id = this.id.get()
        return id ? `record#${id}` : null
      }),
    )
    template = html`<div>${this.record}</div>`
  }

  const record = new State('Hello World!')

  window.document.body.addEventListener('context-request', (event) => {
    const {key, callback} = event.detail
    if (key === 'record#123') {
      callback(record)
    }
  })

  registerComponent(window, Component)
  window.document.body.innerHTML = `
    <wc-component id="123"></wc-component>
  `

  const component = window.document.querySelector('wc-component')

  t.is(component.shadowRoot.textContent, 'Hello World!')

  record.set('Another Message!')
  t.is(component.shadowRoot.textContent, 'Another Message!')
})

test('rendering deep component trees performantly', (t) => {
  const {window} = t.context

  class Parent extends BaseComponent {
    static tagName = 'wc-parent'
    static attributes = []
    toggled = new State(true)
    template = html`
      <div>
        <button
          on:click=${() => {
            this.toggled.set(!this.toggled.get())
          }}
        >
          Toggle
        </button>

        ${new Computed(() =>
          this.toggled.get()
            ? html`<${ToggleOn}><//>`
            : html`<${ToggleOff}><//>`,
        )}
      </div>
    `
  }

  class ToggleOn extends BaseComponent {
    static tagName = 'wc-toggle-on'
    static attributes = []
    template = html`<p>On</p>`
  }

  let toggleOffMountCount = 0

  class ToggleOff extends BaseComponent {
    static tagName = 'wc-toggle-off'
    static attributes = []

    constructor() {
      super()
      toggleOffMountCount++
    }

    count = new State(0)
    template = html`
      <div>
        <p>Off</p>
        <p>${this.count}</p>
        <button
          on:click=${() => {
            this.count.set(this.count.get() + 1)
          }}
        >
          Increment
        </button>
      </div>
    `
  }

  render(Parent, window.document.body)

  const parent = window.document.querySelector('wc-parent')

  t.truthy(parent.shadowRoot.querySelector('wc-toggle-on'))
  t.falsy(parent.shadowRoot.querySelector('wc-toggle-off'))
  t.is(toggleOffMountCount, 0)

  parent.shadowRoot.querySelector('button').click()

  t.falsy(parent.shadowRoot.querySelector('wc-toggle-on'))
  t.truthy(parent.shadowRoot.querySelector('wc-toggle-off'))
  t.is(toggleOffMountCount, 1)

  const toggleOff = parent.shadowRoot.querySelector('wc-toggle-off')
  t.is(toggleOff.shadowRoot.children[0].children[1].textContent, '0')

  toggleOff.shadowRoot.querySelector('button').click()
  t.is(toggleOff.shadowRoot.children[0].children[1].textContent, '1')
  t.is(toggleOffMountCount, 1)
})
