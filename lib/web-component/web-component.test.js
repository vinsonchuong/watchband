import test from 'ava'
import {JSDOM} from 'jsdom'
import {Subject, merge, map} from 'rxjs'
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

  registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-hello></wc-hello>
  `

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

  class Component {
    static tagName = 'wc-counter'
    static attributes = []
    increments = new Subject()
    decrements = new Subject()
    events = merge(
      this.increments.pipe(map(() => ({type: 'increment'}))),
      this.decrements.pipe(map(() => ({type: 'decrement'}))),
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

  t.is(increments.length, 0)
  t.is(decrements.length, 0)

  component.shadowRoot.querySelector('button:nth-child(1)').click()
  t.is(increments.length, 1)
  t.is(decrements.length, 0)

  component.shadowRoot.querySelector('button:nth-child(1)').click()
  t.is(increments.length, 2)
  t.is(decrements.length, 0)

  component.shadowRoot.querySelector('button:nth-child(2)').click()
  t.is(increments.length, 2)
  t.is(decrements.length, 1)
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
  component.component.connected.set(true)

  t.is(component.shadowRoot.textContent, 'Hello World!')

  message.set('Another Message!')
  t.is(component.shadowRoot.textContent, 'Another Message!')
})
