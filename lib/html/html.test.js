import test from 'ava'
import {JSDOM} from 'jsdom'
import {merge, map, scan} from 'rxjs'
import {
  State,
  Computed,
  fromObservable as signalFromObservable,
} from '../signal/index.js'
import {TestObserver} from '../observable/test-observer.js'
import {makeHtml} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('parsing a single HTML element', (t) => {
  const {window} = t.context

  const html = makeHtml(window)
  const {element} = html`<p lang="en">Hello World!</p>`

  t.is(element.tagName, 'P')
  t.is(element.getAttribute('lang'), 'en')
  t.is(element.textContent, 'Hello World!')
})

test('parsing nested HTML', (t) => {
  const {window} = t.context

  const html = makeHtml(window)
  const {element} = html`
    <div>
      <p>Paragraph One</p>
      <p>Paragraph <span>Two</span></p>
      <p>Paragraph Three</p>
    </div>
  `

  t.is(element.tagName, 'DIV')

  t.is(element.children[0].tagName, 'P')
  t.is(element.children[0].textContent, 'Paragraph One')

  t.is(element.children[1].tagName, 'P')
  t.is(element.children[1].childNodes[0].data, 'Paragraph ')
  t.is(element.children[1].children[0].textContent, 'Two')

  t.is(element.children[2].tagName, 'P')
  t.is(element.children[2].textContent, 'Paragraph Three')
})

test('parsing DOM Parts for a single element', (t) => {
  const {window} = t.context

  const html = makeHtml(window)
  const {element, parts} = html`<p lang="{lang}">{text}</p>`

  t.is(parts.lang.value, null)
  t.is(element.getAttribute('lang'), null)

  t.is(parts.text.value, '')
  t.is(element.textContent, '')

  parts.lang.value = 'en'
  t.is(parts.lang.value, 'en')
  t.is(element.getAttribute('lang'), 'en')

  parts.text.value = 'Hello World!'
  t.is(parts.text.value, 'Hello World!')
  t.is(element.textContent, 'Hello World!')
  t.is(element.childNodes[0].data, 'Hello World!')

  parts.text.value = html`<span>Hello World!</span>`.element
  t.is(parts.text.value.tagName, 'SPAN')
})

test('parsing DOM Parts for nested HTML', (t) => {
  const {window} = t.context

  const html = makeHtml(window)
  const {element, parts} = html`
    <div>
      <p lang="{lang1}">{message1}</p>
      <p lang="{lang2}">{message2}</p>
    </div>
  `

  parts.lang1.value = 'en'
  parts.message1.value = 'Hello'
  parts.lang2.value = 'es'
  parts.message2.value = 'Hola'

  t.is(element.children[0].getAttribute('lang'), 'en')
  t.is(element.children[0].textContent, 'Hello')
  t.is(element.children[1].getAttribute('lang'), 'es')
  t.is(element.children[1].textContent, 'Hola')
})

test('parsing event parts, returning observables', (t) => {
  const {window} = t.context

  const html = makeHtml(window)
  const {element, events} = html`
    <div>
      <button on:click="{oneClicks}">One</button>
      <button on:click="{twoClicks}">Two</button>
    </div>
  `

  const oneClicks = []
  events.oneClicks.subscribe({
    next(event) {
      oneClicks.push(event)
    },
  })

  const twoClicks = []
  events.twoClicks.subscribe({
    next(event) {
      twoClicks.push(event)
    },
  })

  element.children[0].click()
  t.is(oneClicks.length, 1)
  t.is(twoClicks.length, 0)

  element.children[1].click()
  t.is(oneClicks.length, 1)
  t.is(twoClicks.length, 1)

  t.true(oneClicks[0] instanceof window.MouseEvent)
  t.is(oneClicks[0].type, 'click')

  t.true(twoClicks[0] instanceof window.MouseEvent)
  t.is(twoClicks[0].type, 'click')
})

test('binding signals to HTML', (t) => {
  const {window} = t.context
  const html = makeHtml(window)

  const title1 = new State('P1')
  const content1 = new State('Paragraph 1')
  const title2 = new State('P2')
  const content2 = new State('Paragraph 2')

  const {element} = html`
    <div>
      <p title="${title1}">${content1}</p>
      <p title="${title2}">${content2}</p>
    </div>
  `

  t.is(element.children[0].getAttribute('title'), 'P1')
  t.is(element.children[0].textContent, 'Paragraph 1')
  t.is(element.children[1].getAttribute('title'), 'P2')
  t.is(element.children[1].textContent, 'Paragraph 2')

  title1.set('First Paragraph')
  t.is(element.children[0].getAttribute('title'), 'First Paragraph')
  t.is(element.children[0].textContent, 'Paragraph 1')
  t.is(element.children[1].getAttribute('title'), 'P2')
  t.is(element.children[1].textContent, 'Paragraph 2')

  content1.set('This is the first paragraph')
  t.is(element.children[0].getAttribute('title'), 'First Paragraph')
  t.is(element.children[0].textContent, 'This is the first paragraph')
  t.is(element.children[1].getAttribute('title'), 'P2')
  t.is(element.children[1].textContent, 'Paragraph 2')
})

test('binding observers to HTML', (t) => {
  const {window} = t.context
  const html = makeHtml(window)

  const oneClicks = new TestObserver()
  const twoClicks = new TestObserver()
  const threeClicks = []

  const {element} = html`
    <div>
      <button on:click=${oneClicks}>One</button>
      <button on:click=${twoClicks}>Two</button>
      <button
        on:click=${(event) => {
          threeClicks.push(event)
        }}
      >
        Three
      </button>
    </div>
  `

  element.children[0].click()
  t.is(oneClicks.events.length, 1)
  t.is(twoClicks.events.length, 0)
  t.is(threeClicks.length, 0)

  element.children[1].click()
  t.is(oneClicks.events.length, 1)
  t.is(twoClicks.events.length, 1)
  t.is(threeClicks.length, 0)

  element.children[2].click()
  t.is(oneClicks.events.length, 1)
  t.is(twoClicks.events.length, 1)
  t.is(threeClicks.length, 1)
})

test('expressing an interaction', (t) => {
  const {window} = t.context
  const html = makeHtml(window)

  const increments = new TestObserver()
  const decrements = new TestObserver()

  const count = signalFromObservable(
    merge(increments.pipe(map(() => 1)), decrements.pipe(map(() => -1))).pipe(
      scan((runningCount, operand) => runningCount + operand, 0),
    ),
    0,
  )

  const {element} = html`
    <div>
      <p>${count}</p>
      <button on:click=${increments}>Increment</button>
      <button on:click=${decrements}>Decrement</button>
    </div>
  `

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

test('using arrays', (t) => {
  const {window} = t.context
  const html = makeHtml(window, {
    transform({children}) {
      return {
        children: children.flat(),
      }
    },
  })

  const {element} = html`
    <div>
      ${[
        html`<p>Paragraph 1</p>`.element,
        html`<p>Paragraph 2</p>`.element,
        html`<p>Paragraph 3</p>`.element,
      ]}
    </div>
  `

  t.is(element.children[0].textContent, 'Paragraph 1')
  t.is(element.children[1].textContent, 'Paragraph 2')
  t.is(element.children[2].textContent, 'Paragraph 3')
})

test('using dynamic conditionals', (t) => {
  const {window} = t.context
  const html = makeHtml(window)

  const condition = new State(false)

  const {element} = html`
    <div>
      ${new Computed(() =>
        condition.get()
          ? html`<p>Condition True</p>`.element
          : html`<p>Condition False</p>`.element,
      )}
    </div>
  `
  t.is(element.children[0].textContent, 'Condition False')

  condition.set(true)
  t.is(element.children[0].textContent, 'Condition True')
})

test('configuring custom child transformations', (t) => {
  const {window} = t.context
  const html = makeHtml(window, {
    transform({children}) {
      return {
        children: children.map((child) => {
          if (typeof child === 'function') {
            return new Computed(() => {
              const computedResult = child()

              if (computedResult?.element) {
                return computedResult.element
              }

              return computedResult
            })
          }

          return child
        }),
      }
    },
  })

  const condition = new State(false)

  const {element} = html`
    <div>
      ${() =>
        condition.get()
          ? html`<p>Condition True</p>`
          : html`<p>Condition False</p>`}
    </div>
  `
  t.is(element.children[0].textContent, 'Condition False')

  condition.set(true)
  t.is(element.children[0].textContent, 'Condition True')
})

test('configuring custom attribute transformations', (t) => {
  const {window} = t.context

  let currentId = 0
  const objectMap = new Map()
  const html = makeHtml(window, {
    transform({attributes}) {
      return {
        attributes: Object.fromEntries(
          Object.entries(attributes).map(([name, value]) => {
            if (typeof value === 'string') {
              return [name, value]
            }

            const id = `${currentId++}`
            objectMap.set(id, value)
            return [name, id]
          }),
        ),
      }
    },
  })

  const data = {message: 'Complex Object'}

  const {element} = html`<wc-component data=${data}></wc-component>`
  t.is(typeof element.getAttribute('data'), 'string')
  t.is(objectMap.get(element.getAttribute('data')), data)
})

test('configuring custom tag transformations', (t) => {
  const {window} = t.context

  const html = makeHtml(window, {
    transform({tag}) {
      return {
        tag: typeof tag === 'string' ? tag : tag.tagName,
      }
    },
  })

  const Component = {
    tagName: 'wc-component',
  }

  const {element} = html`<${Component}><//>`
  t.is(element.tagName, 'WC-COMPONENT')
})
