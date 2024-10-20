import test from 'ava'
import {JSDOM} from 'jsdom'
import {Subject, map, scan, merge} from 'rxjs'
import {State, fromObservable as signalFromObservable} from '../signal/index.js'
import {registerComponent} from './hot-reloading.js'
import {html} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('hot reloading a static component', (t) => {
  const {window} = t.context

  class Static {
    static tagName = 'wc-static'
    static attributes = []
    template = html`<p>Hello World!</p>`
  }

  const StaticWebComponent = registerComponent(window, Static)

  window.document.body.innerHTML = `
    <wc-static></wc-static>
  `

  const component = window.document.querySelector('wc-static')

  t.is(component.shadowRoot.textContent, 'Hello World!')

  class NewStatic {
    static tagName = 'wc-static'
    static attributes = []
    template = html`<p>Something Else!</p>`
  }

  StaticWebComponent.replaceComponent(NewStatic)

  t.is(component.shadowRoot.textContent, 'Something Else!')
})

test('hot reloading a component that is not attached to the document', (t) => {
  const {window} = t.context

  class Static {
    static tagName = 'wc-static'
    static attributes = []
    template = html`<p>Hello World!</p>`
  }

  const StaticWebComponent = registerComponent(window, Static)

  window.document.body.innerHTML = `
    <wc-static></wc-static>
  `

  const component = window.document.querySelector('wc-static')
  component.remove()

  class NewStatic {
    static tagName = 'wc-static'
    static attributes = []
    template = html`<p>Something Else!</p>`
  }

  StaticWebComponent.replaceComponent(NewStatic)
  window.document.body.append(component)

  t.is(component.shadowRoot.textContent, 'Something Else!')
})

test('hot reloading a component with internal state', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-component'
    static attributes = []
    state = new State('Hello World!')
    template = html`<p>${this.state}</p>`
  }

  const WebComponent = registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-component></wc-component>
  `

  const component = window.document.querySelector('wc-component')

  t.is(component.shadowRoot.textContent, 'Hello World!')

  class NewComponent {
    static tagName = 'wc-component'
    static attributes = []
    state = new State('Something Else!')
    template = html`<p>${this.state}</p>`
  }

  WebComponent.replaceComponent(NewComponent)

  t.is(component.shadowRoot.textContent, 'Something Else!')
})

test('hot reloading a component that takes attributes', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-component'
    static attributes = ['message']
    message = new State('')
    template = html`
      <div>
        <p>Component</p>
        <p>${this.message}</p>
      </div>
    `
  }

  const WebComponent = registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-component message="Hello World!"></wc-component>
  `

  const component = window.document.querySelector('wc-component')

  t.is(component.shadowRoot.children[0].children[0].textContent, 'Component')
  t.is(component.shadowRoot.children[0].children[1].textContent, 'Hello World!')

  class NewComponent {
    static tagName = 'wc-component'
    static attributes = ['message']
    message = new State('')
    template = html`
      <div>
        <p>NewComponent</p>
        <p>${this.message}</p>
      </div>
    `
  }

  WebComponent.replaceComponent(NewComponent)

  t.is(component.shadowRoot.children[0].children[0].textContent, 'NewComponent')
  t.is(component.shadowRoot.children[0].children[1].textContent, 'Hello World!')
})

test('hot reloading a component that listens for events internally', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-component'
    static attributes = []
    clicks = new Subject()
    count = signalFromObservable(
      this.clicks.pipe(
        map(() => 1),
        scan((count, increment) => count + increment, 0),
      ),
      0,
    )
    template = html`
      <div>
        <p>${this.count}</p>
        <button on:click=${this.clicks}>Increment</button>
      </div>
    `
  }

  const WebComponent = registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-component></wc-component>
  `

  const component = window.document.querySelector('wc-component')

  t.is(component.shadowRoot.querySelector('p').textContent, '0')
  component.shadowRoot.querySelector('button').click()
  t.is(component.shadowRoot.querySelector('p').textContent, '1')

  class NewComponent {
    static tagName = 'wc-component'
    static attributes = []
    increments = new Subject()
    decrements = new Subject()
    count = signalFromObservable(
      merge(
        this.increments.pipe(map(() => 1)),
        this.decrements.pipe(map(() => -1)),
      ).pipe(scan((count, operand) => count + operand, 0)),
      0,
    )
    template = html`
      <div>
        <p>${this.count}</p>
        <button on:click=${this.increments}>Increment</button>
        <button on:click=${this.decrements}>Decrement</button>
      </div>
    `
  }

  WebComponent.replaceComponent(NewComponent)

  t.is(component.shadowRoot.querySelector('p').textContent, '0')
  component.shadowRoot.querySelector('button:nth-child(2)').click()
  t.is(component.shadowRoot.querySelector('p').textContent, '1')
  component.shadowRoot.querySelector('button:nth-child(3)').click()
  t.is(component.shadowRoot.querySelector('p').textContent, '0')
})

test('hot reloading a component that emits events', (t) => {
  const {window} = t.context

  class Component {
    static tagName = 'wc-component'
    static attributes = []
    clicks = new Subject()
    events = this.clicks.pipe(map(() => ({type: 'component-click'})))
    template = html`
      <div>
        <button on:click=${this.clicks}>Click</button>
      </div>
    `
  }

  const WebComponent = registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wc-component></wc-component>
  `

  const component = window.document.querySelector('wc-component')

  const events = []
  component.addEventListener('component-click', (event) => {
    events.push(event)
  })

  t.is(events.length, 0)

  component.shadowRoot.querySelector('button').click()
  t.is(events.length, 1)

  class NewComponent {
    static tagName = 'wc-component'
    static attributes = []
    clicks = new Subject()
    events = this.clicks.pipe(map(() => ({type: 'component-click'})))
    template = html`
      <div>
        <button on:click=${this.clicks}>Press</button>
      </div>
    `
  }

  WebComponent.replaceComponent(NewComponent)

  component.shadowRoot.querySelector('button').click()
  t.is(events.length, 2)
})
