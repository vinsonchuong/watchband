import test from 'ava'
import {JSDOM} from 'jsdom'
import {State, Computed} from '../signal/index.js'
import {TestObserver} from '../observable/test-observer.js'
import {html, makeRender} from './index.js'

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('parsing a single HTML element', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment} = render(html`<p lang="en">Hello World!</p>`)

  t.is(fragment.childElementCount, 1)

  const element = fragment.firstElementChild

  t.is(element.tagName, 'P')
  t.is(element.getAttribute('lang'), 'en')
  t.is(element.textContent, 'Hello World!')
})

test('parsing multiple top-level HTML elements', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment} = render(html`
    <p>One</p>
    <p>Two</p>
    <p>Three</p>
  `)

  t.is(fragment.childElementCount, 3)

  t.is(fragment.children[0].tagName, 'P')
  t.is(fragment.children[0].textContent, 'One')
  t.is(fragment.children[1].tagName, 'P')
  t.is(fragment.children[1].textContent, 'Two')
  t.is(fragment.children[2].tagName, 'P')
  t.is(fragment.children[2].textContent, 'Three')
})

test('parsing boolean attributes', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  {
    const {fragment} = render(html`<input type="checkbox" checked />`)
    const element = fragment.firstElementChild

    t.is(element.tagName, 'INPUT')
    t.is(element.getAttribute('type'), 'checkbox')
    t.is(element.getAttribute('checked'), '')
    t.true(element.checked)
  }

  {
    const {fragment} = render(html`<input type="checkbox" />`)
    const element = fragment.firstElementChild
    t.false(element.checked)
  }
})

test('setting properties via prop: attribute', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const {fragment} = render(html`<input prop:value="Hello World!" />`)
  const element = fragment.firstElementChild

  t.is(element.tagName, 'INPUT')
  t.is(element.getAttribute('value'), null)
  t.is(element.value, 'Hello World!')
})

test('parsing nested HTML', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)

  const {fragment} = render(html`
    <div>
      <p>Paragraph One</p>
      <p>Paragraph <span>Two</span></p>
      <p>Paragraph Three</p>
    </div>
  `)
  const element = fragment.firstElementChild

  t.is(element.tagName, 'DIV')

  t.is(element.children[0].tagName, 'P')
  t.is(element.children[0].textContent, 'Paragraph One')

  t.is(element.children[1].tagName, 'P')
  t.is(element.children[1].childNodes[0].data, 'Paragraph ')
  t.is(element.children[1].children[0].textContent, 'Two')

  t.is(element.children[2].tagName, 'P')
  t.is(element.children[2].textContent, 'Paragraph Three')
})

test('nesting templates', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const {fragment} = render(html`<div>${html`<p>Hello World!</p>`}</div>`)

  t.is(
    fragment.firstElementChild.firstElementChild.outerHTML,
    '<p>Hello World!</p>',
  )
})

test('nesting an array of templates', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const {fragment} = render(
    html`<div>
      ${[html`<p>One</p>`, html`<p>Two</p>`, html`<p>Three</p>`]}
    </div>`,
  )
  const element = fragment.firstElementChild

  t.is(element.children.length, 3)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1].textContent, 'Two')
  t.is(element.children[2].textContent, 'Three')
})

test('parsing DOM Parts for a single element', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment, parts} = render(html`<p lang="{lang}">{text}</p>`)

  const element = fragment.firstElementChild

  t.is(parts.lang.value, null)
  t.is(element.getAttribute('lang'), null)

  t.deepEqual(parts.text.value, [])
  t.is(element.textContent, '')

  parts.lang.value = 'en'
  t.is(parts.lang.value, 'en')
  t.is(element.getAttribute('lang'), 'en')

  parts.text.value = 'Hello World!'
  t.is(parts.text.value.textContent, 'Hello World!')
  t.is(element.textContent, 'Hello World!')
  t.is(element.childNodes[1].data, 'Hello World!')

  parts.text.value = html`<span>Hello World!</span>`
  t.is(parts.text.value[1].tagName, 'SPAN')
  t.is(element.textContent, 'Hello World!')
})

test('parsing DOM Parts for multiple top-level elements', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment, parts} = render(html`
    <p lang="{lang1}">{message1}</p>
    <p lang="{lang2}">{message2}</p>
  `)

  parts.lang1.value = 'en'
  parts.message1.value = 'Hello'
  parts.lang2.value = 'es'
  parts.message2.value = 'Hola'

  t.is(fragment.children[0].getAttribute('lang'), 'en')
  t.is(fragment.children[0].textContent, 'Hello')
  t.is(fragment.children[1].getAttribute('lang'), 'es')
  t.is(fragment.children[1].textContent, 'Hola')
})

test('parsing DOM Parts for nested HTML', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment, parts} = render(html`
    <div>
      <p lang="{lang1}">{message1}</p>
      <p lang="{lang2}">{message2}</p>
    </div>
  `)
  const element = fragment.firstElementChild

  parts.lang1.value = 'en'
  parts.message1.value = 'Hello'
  parts.lang2.value = 'es'
  parts.message2.value = 'Hola'

  t.is(element.children[0].getAttribute('lang'), 'en')
  t.is(element.children[0].textContent, 'Hello')
  t.is(element.children[1].getAttribute('lang'), 'es')
  t.is(element.children[1].textContent, 'Hola')
})

test('parsing DOM Parts for nested templates', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment, parts, templates} = render(
    // prettier-ignore
    html`
      <div>
        {parentText}
        ${html`
          <p>
            {childText}
          </p>
        `}
      </div>
    `,
  )

  const element = fragment.firstElementChild

  t.deepEqual(parts.parentText.value, [])
  t.deepEqual(templates[0].parts.childText.value, [])

  parts.parentText.value = 'Hello'

  t.is(element.textContent, 'Hello')

  templates[0].parts.childText.value = 'World'

  t.is(element.textContent, 'HelloWorld')
})

test('using DOM Parts for properties', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment, parts} = render(html`<input prop:value="{value}" />`)
  const element = fragment.firstElementChild

  parts.value.value = 'Hello World!'
  t.is(element.tagName, 'INPUT')
  t.is(element.getAttribute('value'), null)
  t.is(element.value, 'Hello World!')
})

test('parsing event parts, returning observables', (t) => {
  const {window} = t.context

  const {render} = makeRender(window)
  const {fragment, parts} = render(html`
    <div>
      <button on:click="{oneClicks}">One</button>
      <button on:click="{twoClicks}">Two</button>
    </div>
  `)
  const element = fragment.firstElementChild

  const oneClicks = []
  parts.oneClicks.subscribe({
    next(event) {
      oneClicks.push(event)
    },
  })

  const twoClicks = []
  parts.twoClicks.subscribe({
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
  const {render} = makeRender(window)

  const title1 = new State('P1')
  const content1 = new State('Paragraph 1')
  const title2 = new State('P2')
  const content2 = new State('Paragraph 2')

  const {fragment} = render(html`
    <div>
      <p title="${title1}">${content1}</p>
      <p title="${title2}">${content2}</p>
    </div>
  `)

  const element = fragment.firstElementChild

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

test('binding signals to a template with multiple top-level elements', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const title1 = new State('P1')
  const content1 = new State('Paragraph 1')
  const title2 = new State('P2')
  const content2 = new State('Paragraph 2')

  const {fragment} = render(html`
    <p title="${title1}">${content1}</p>
    <p title="${title2}">${content2}</p>
  `)

  t.is(fragment.children[0].getAttribute('title'), 'P1')
  t.is(fragment.children[0].textContent, 'Paragraph 1')
  t.is(fragment.children[1].getAttribute('title'), 'P2')
  t.is(fragment.children[1].textContent, 'Paragraph 2')

  title1.set('First Paragraph')
  t.is(fragment.children[0].getAttribute('title'), 'First Paragraph')
  t.is(fragment.children[0].textContent, 'Paragraph 1')
  t.is(fragment.children[1].getAttribute('title'), 'P2')
  t.is(fragment.children[1].textContent, 'Paragraph 2')

  content1.set('This is the first paragraph')
  t.is(fragment.children[0].getAttribute('title'), 'First Paragraph')
  t.is(fragment.children[0].textContent, 'This is the first paragraph')
  t.is(fragment.children[1].getAttribute('title'), 'P2')
  t.is(fragment.children[1].textContent, 'Paragraph 2')
})

test('binding signals of templates to HTML', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const nestedTemplate = new State(html`<p>Hello World!</p>`)

  const {fragment} = render(html`<div>${nestedTemplate}</div>`)
  const element = fragment.firstElementChild

  t.is(element.textContent, 'Hello World!')

  nestedTemplate.set(html`<p>Another Message</p>`)
  t.is(element.textContent, 'Another Message')
})

test('binding signals of conditional templates to HTML', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const condition = new State(false)

  const {fragment} = render(html`
    <div>
      ${new Computed(() =>
        condition.get()
          ? html`<p>Condition True</p>`
          : html`<p>Condition False</p>`,
      )}
    </div>
  `)
  const element = fragment.firstElementChild

  t.is(element.children[0].textContent, 'Condition False')

  condition.set(true)
  t.is(element.children[0].textContent, 'Condition True')
})

test('binding signals to element properties', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const value = new State('Hello World!')
  const {fragment} = render(html`<input prop:value=${value} />`)
  const element = fragment.firstElementChild

  t.is(element.getAttribute('value'), null)
  t.is(element.value, 'Hello World!')

  value.set('Bye Now!')
  t.is(element.value, 'Bye Now!')
})

test('binding a signal of a list of templates to HTML', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const list = new State([])

  const {fragment} = render(html`
    <ul>
      ${list}
    </ul>
  `)
  const element = fragment.firstElementChild

  t.is(element.children.length, 0)

  const oneTemplate = html`<li>One</li>`
  const twoTemplate = html`<li>Two</li>`
  const threeTemplate = html`<li>Three</li>`
  list.set([oneTemplate, twoTemplate, threeTemplate])

  t.is(element.children.length, 3)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1].textContent, 'Two')
  t.is(element.children[2].textContent, 'Three')

  const oneElement = element.children[0]
  const twoElement = element.children[1]
  const threeElement = element.children[2]

  list.set([oneTemplate, threeTemplate])

  t.is(element.children.length, 2)
  t.is(element.children[0], oneElement)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1], threeElement)
  t.is(element.children[1].textContent, 'Three')

  list.set([oneTemplate, twoTemplate, threeTemplate])
  t.is(element.children.length, 3)
  t.is(element.children[0], oneElement)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1], twoElement)
  t.is(element.children[1].textContent, 'Two')
  t.is(element.children[2], threeElement)
  t.is(element.children[2].textContent, 'Three')

  list.set([oneTemplate, threeTemplate, twoTemplate])
  t.is(element.children.length, 3)
  t.is(element.children[0], oneElement)
  t.is(element.children[0].textContent, 'One')
  t.is(element.children[1], threeElement)
  t.is(element.children[1].textContent, 'Three')
  t.is(element.children[2], twoElement)
  t.is(element.children[2].textContent, 'Two')

  list.set([html`<li>Something</li>`, twoTemplate, html`<li>Else</li>`])

  t.is(element.children.length, 3)
  t.is(element.children[0].textContent, 'Something')
  t.is(element.children[1], twoElement)
  t.is(element.children[2].textContent, 'Else')

  list.set([])

  t.is(element.children.length, 0)
})

test('binding observers to HTML', (t) => {
  const {window} = t.context
  const {render} = makeRender(window)

  const oneClicks = new TestObserver()
  const twoClicks = new TestObserver()
  const threeClicks = []

  const {fragment} = render(html`
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
  `)
  const element = fragment.firstElementChild

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

test('resuming a pre-rendered template with signals', (t) => {
  const {window} = t.context
  const {render, resume} = makeRender(window)

  const {fragment} = render(html`
    <div>
      <p title="${new State('P1')}">${new State('Paragraph 1')}</p>
      <p title="${new State('P2')}">${new State('Paragraph 2')}</p>
    </div>
  `)

  const element = fragment.firstElementChild

  const preRenderedElement = element.cloneNode(true)

  const title1 = new State('P1')
  const content1 = new State('Paragraph 1')
  const title2 = new State('P2')
  const content2 = new State('Paragraph 2')

  resume(
    html`
      <div>
        <p title="${title1}">${content1}</p>
        <p title="${title2}">${content2}</p>
      </div>
    `,
    preRenderedElement,
  )

  t.is(preRenderedElement.children[0].getAttribute('title'), 'P1')
  t.is(preRenderedElement.children[0].textContent, 'Paragraph 1')
  t.is(preRenderedElement.children[1].getAttribute('title'), 'P2')
  t.is(preRenderedElement.children[1].textContent, 'Paragraph 2')

  title1.set('PA')
  title2.set('PB')
  t.is(preRenderedElement.children[0].getAttribute('title'), 'PA')
  t.is(preRenderedElement.children[1].getAttribute('title'), 'PB')

  content1.set('Other 1')
  content2.set('Other 2')
  t.is(preRenderedElement.children[0].textContent, 'Other 1')
  t.is(preRenderedElement.children[1].textContent, 'Other 2')
})

test('resuming nested templates', (t) => {
  const {window} = t.context
  const {render, resume} = makeRender(window)

  const {fragment} = render(html`
    <div>
      <p>${new State('One')}</p>
      ${html`<p>${new State('Two')}</p>`}
    </div>
  `)
  const element = fragment.firstElementChild
  const preRenderedElement = element.cloneNode(true)

  const one = new State('One')
  const two = new State('Two')

  resume(
    html`
      <div>
        <p>${one}</p>
        ${html`<p>${two}</p>`}
      </div>
    `,
    preRenderedElement,
  )

  t.is(preRenderedElement.children[0].textContent, 'One')
  t.is(preRenderedElement.children[1].textContent, 'Two')

  one.set('One!')
  two.set('Two!')
  t.is(preRenderedElement.children[0].textContent, 'One!')
  t.is(preRenderedElement.children[1].textContent, 'Two!')
})

test('resuming a pre-rendered template with observables', (t) => {
  const {window} = t.context
  const {render, resume} = makeRender(window)

  const {fragment} = render(html`
    <div>
      <button on:click=${new TestObserver()}>One</button>
      <button on:click=${new TestObserver()}>Two</button>
    </div>
  `)

  const element = fragment.firstElementChild

  const preRenderedElement = element.cloneNode(true)

  const oneClicks = new TestObserver()
  const twoClicks = new TestObserver()

  resume(
    html`
      <div>
        <button on:click=${oneClicks}>One</button>
        <button on:click=${twoClicks}>Two</button>
      </div>
    `,
    preRenderedElement,
  )

  preRenderedElement.children[0].click()
  t.is(oneClicks.events.length, 1)
  t.is(twoClicks.events.length, 0)

  preRenderedElement.children[1].click()
  t.is(oneClicks.events.length, 1)
  t.is(twoClicks.events.length, 1)
})

test('capturing events and replaying them after resuming', (t) => {
  const {window} = t.context
  const {render, capture, resume} = makeRender(window)

  const {fragment} = render(html`
    <div>
      <button on:click=${new TestObserver()}>One</button>
      <button on:click=${new TestObserver()}>Two</button>
    </div>
  `)

  const element = fragment.firstElementChild

  const preRenderedElement = element.cloneNode(true)
  window.document.body.append(preRenderedElement)

  capture()

  preRenderedElement.children[0].click()
  preRenderedElement.children[1].click()

  const oneClicks = new TestObserver()
  const twoClicks = new TestObserver()

  resume(
    html`
      <div>
        <button on:click=${oneClicks}>One</button>
        <button on:click=${twoClicks}>Two</button>
      </div>
    `,
    preRenderedElement,
  )

  t.is(oneClicks.events.length, 1)
  t.is(twoClicks.events.length, 1)
})

test('capturing events through a shadow DOM boundary', (t) => {
  const {window} = t.context
  const {render, capture, resume} = makeRender(window)

  const {fragment} = render(html`
    <div>
      <button on:click=${new TestObserver()}>One</button>
      <button on:click=${new TestObserver()}>Two</button>
    </div>
  `)
  const element = fragment.firstElementChild
  const preRenderedElement = element.cloneNode(true)

  class CustomElement extends window.HTMLElement {
    connectedCallback() {
      const shadow = this.attachShadow({mode: 'open'})
      shadow.append(preRenderedElement)
    }
  }
  window.customElements.define('custom-element', CustomElement)

  window.document.body.innerHTML = '<custom-element></custom-element>'

  capture()

  preRenderedElement.children[0].click()
  preRenderedElement.children[1].click()

  const oneClicks = new TestObserver()
  const twoClicks = new TestObserver()

  resume(
    html`
      <div>
        <button on:click=${oneClicks}>One</button>
        <button on:click=${twoClicks}>Two</button>
      </div>
    `,
    preRenderedElement,
  )

  t.is(oneClicks.events.length, 1)
  t.is(twoClicks.events.length, 1)
})
