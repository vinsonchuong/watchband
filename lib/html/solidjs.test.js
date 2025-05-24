import test from 'ava'
import {JSDOM} from 'jsdom'
import {State, Computed, isSignal} from '../signal/index.js'
import {chain} from '../strategy/index.js'
import {
  bindAttribute,
  configureCreateElement,
  configureCreateFragment,
  bindChildPlugins,
} from './html.js'
import {makeHtml} from './index.js'

const bindChild = chain(
  (next) => (context, element, maybeChildArray) => {
    if (!Array.isArray(maybeChildArray)) {
      return next(context, element, maybeChildArray)
    }

    for (const child of maybeChildArray) {
      next(context, element, child)
    }
  },
  (next) => (context, element, child) => {
    return next(
      context,
      element,
      isSignal(child)
        ? new Computed(() => {
            const value = child.get()
            return value?.element ?? value
          })
        : child,
    )
  },
  ...bindChildPlugins,
)

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window

  t.context.html = makeHtml(
    t.context.window,
    chain(
      (next) => (context, tag, attributes, children) => {
        return typeof tag === 'function'
          ? tag({...attributes, children}).element
          : next(context, tag, attributes, children)
      },
      configureCreateElement(bindAttribute, bindChild),
    ),
    chain(configureCreateFragment(bindChild)),
  )
})

test('using components', (t) => {
  const {html} = t.context

  function Container({children}) {
    return html`<div>${children}</div>`
  }

  function Message({camelCase}) {
    return html`<p>${camelCase}</p>`
  }

  const {element} = html`
    <${Container}>
      <${Message} camelCase="Hello World!" />
    <//>
  `

  t.is(element.outerHTML, '<div><p>Hello World!</p></div>')
})

test('implementing the Show component', (t) => {
  const {html, window} = t.context

  function Show({when, fallback, children}) {
    const signal = new Computed(() => {
      return when.get() ? children[0] : fallback
    })
    return html`${signal}`
  }

  const when = new State(false)

  const {element} = html`
    <${Show} when=${when} fallback=${html`<p>False</p>`}>
      <p>True</p>
    <//>
  `

  t.true(element instanceof window.DocumentFragment)
  t.is(element.children[0].textContent, 'False')

  when.set(true)

  t.is(element.children[0].textContent, 'True')

  const div = window.document.createElement('div')
  div.append(element)

  t.is(div.innerHTML, '<p>True</p>')

  when.set(false)

  t.is(div.innerHTML, '<p>False</p>')
})

test('implementing the For component', (t) => {
  const {html, window} = t.context

  function For({each, children: [render]}) {
    const signal = new Computed(() => {
      return each.get().map((item) => render(item).element)
    })

    return html`${signal}`
  }

  const signal = new State([{text: 'One'}, {text: 'Two'}, {text: 'Three'}])

  const {element} = html`
    <${For} each=${signal}>${(item) => html`<p>${item.text}</p>`}<//>
  `

  t.true(element instanceof window.DocumentFragment)
  t.is(element.children.length, 3)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1].textContent, 'Two')
  t.is(element.children[2].textContent, 'Three')

  signal.set([{text: 'One'}, {text: 'Two'}])

  t.is(element.children.length, 2)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1].textContent, 'Two')
})

test('handling events', (t) => {
  const {html} = t.context

  function Counter() {
    const count = new State(0)

    return html`
      <p>${count}</p>
      <button on:click=${() => count.set(count.get() + 1)}>Increment</button>
      <button on:click=${() => count.set(count.get() - 1)}>Decrement</button>
    `
  }

  const {element} = html` <${Counter}><//> `

  t.is(element.children[0].textContent, '0')

  element.children[1].click()
  t.is(element.children[0].textContent, '1')

  element.children[1].click()
  t.is(element.children[0].textContent, '2')

  element.children[2].click()
  t.is(element.children[0].textContent, '1')

  element.children[2].click()
  t.is(element.children[0].textContent, '0')
})
