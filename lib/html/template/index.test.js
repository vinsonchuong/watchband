import test from 'ava'
import {JSDOM} from 'jsdom'
import {State, Computed} from '../../signal/index.js'
import {makeRender, html} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('making and rendering a template', (t) => {
  const {window} = t.context
  const render = makeRender(window)

  const template = html`<p>Hello World!</p>`
  const {element} = render(template)

  t.is(element.textContent, 'Hello World!')
})

test('making and rendering a template containing nested templates', (t) => {
  const {window} = t.context
  const render = makeRender(window)

  const template = html`
    <ul>
      ${html`<li>One</li>`} ${html`<li>Two</li>`}
    </ul>
  `
  const {element} = render(template)

  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1].textContent, 'Two')
})

test('making and rendering a template containing a dynamic nested template', (t) => {
  const {window} = t.context
  const render = makeRender(window)

  const signal = new State(true)
  const template = html`
    <div>
      ${new Computed(() =>
        signal.get() ? html`<p>True</p>` : html`<p>False</p>`,
      )}
    </div>
  `
  const {element} = render(template)

  t.is(element.children[0].textContent, 'True')

  signal.set(false)

  t.is(element.children[0].textContent, 'False')
})

test('making and rendering a template containing dynamic nested templates', (t) => {
  const {window} = t.context
  const render = makeRender(window)

  const signal = new State(true)
  const template = html`
    <div>
      ${new Computed(() =>
        signal.get()
          ? [html`<p>One</p>`, html`<p>Two</p>`]
          : [html`<p>Nothing</p>`],
      )}
    </div>
  `
  const {element} = render(template)

  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1].textContent, 'Two')

  signal.set(false)

  t.is(element.children[0].textContent, 'Nothing')
})

test('making and rendering a template containing nested templates without a containing element', (t) => {
  const {window} = t.context
  const render = makeRender(window)

  const template = html`${html`<p>One</p>`} ${html`<p>Two</p>`}`
  const {element} = render(template)

  t.true(element instanceof window.DocumentFragment)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1].textContent, 'Two')
})

test('making and rendering a template containing a dynamic nested template without a containing element', (t) => {
  const {window} = t.context
  const render = makeRender(window)

  const boolean = new State(true)
  const template = html`${new Computed(() =>
    boolean.get() ? html`<p>True</p>` : html`<p>False</p>`,
  )}`
  const {element} = render(template)

  t.true(element instanceof window.DocumentFragment)
  t.is(element.children[0].textContent, 'True')

  boolean.set(false)

  t.is(element.children[0].textContent, 'False')
})

test('making and rendering a template containing a dynamic list of nested templates without a containing element', (t) => {
  const {window} = t.context
  const render = makeRender(window)

  const boolean = new State(true)
  const template = html`${new Computed(() =>
    boolean.get() ? [html`<p>Foo</p>`, html`<p>Bar</p>`] : [html`<p>Hi</p>`],
  )}`
  const {element} = render(template)

  t.true(element instanceof window.DocumentFragment)
  t.is(element.children.length, 2)
  t.is(element.children[0].textContent, 'Foo')
  t.is(element.children[1].textContent, 'Bar')

  boolean.set(false)

  t.is(element.children.length, 1)
  t.is(element.children[0].textContent, 'Hi')
})
