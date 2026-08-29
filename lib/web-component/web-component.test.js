import test from 'ava'
import {JSDOM} from 'jsdom'
import {scan, startWith, map} from 'rxjs'
import {findElement, clickElement, evalInTab} from 'puppet-strings'
import {State} from '../signal/index.js'
import {useBrowser, useBrowserTab} from '../../test-lib/browser/index.js'
import {useServer} from '../../test-lib/http/index.js'
import {serialize} from './serialize.js'
import {
  Component as BaseComponent,
  registerComponent,
  html,
  css,
  Provider,
} from './index.js'

useBrowser(test)

test.beforeEach((t) => {
  const jsdom = new JSDOM('<!doctype html>')
  t.context.jsdom = jsdom
  t.context.window = jsdom.window
})

test('making a component that renders static content', (t) => {
  const {window} = t.context

  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    template = html`<p>Hello World!</p>`
  }

  registerComponent(window, Component)

  window.document.body.innerHTML = '<wb-hello></wb-hello>'

  const component = window.document.querySelector('wb-hello')
  t.is(component.shadowRoot.textContent, 'Hello World!')
})

test('making a component that renders styles', async (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    static styles = css`
      p {
        color: pink;
      }
    `
    template = html`<p>Hello World!</p>`
  }

  await useServer(t, 10_103, {
    'index.html': `
      <!doctype html>
      <script type="module">
        import {
          html,
          css,
          Component as BaseComponent,
          registerComponent,
        } from '/npm/watchband/web-component'

        ${Component.toString()}

        registerComponent(window, Component)
        document.body.innerHTML = \`<wb-hello></wb-hello>\`
      </script>
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10103')

  await findElement(tab, 'wb-hello')

  t.is(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wb-hello')
        const paragraph = component.shadowRoot.firstElementChild
        const styles = window.getComputedStyle(paragraph)
        return styles.color
      `,
    ),
    'rgb(255, 192, 203)',
  )
})

test('server rendering a component that renders styles', async (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    static styles = css`
      p {
        color: pink;
      }
    `
    template = html`<p>Hello World!</p>`
  }

  const htmlString = serialize(html`<wb-hello></wb-hello>`, {
    components: [Component],
  })

  await useServer(t, 10_104, {
    'index.html': `
      <!doctype html>
      <body>
        ${htmlString}
      </body>
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10104')

  t.is(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wb-hello')
        const paragraph = component.shadowRoot.querySelector('p')
        const styles = window.getComputedStyle(paragraph)
        return styles.color
      `,
    ),
    'rgb(255, 192, 203)',
  )
})

test('making a component that renders dynamic content', (t) => {
  const {window} = t.context

  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    message = this.attribute('message')
    template = html`<p>${this.message}</p>`
  }

  registerComponent(window, Component)

  window.document.body.innerHTML = `
    <wb-hello message="Hello World!"></wb-hello>
  `

  const component = window.document.querySelector('wb-hello')
  t.is(component.shadowRoot.textContent, 'Hello World!')

  component.setAttribute('message', 'Something Else!')
  t.is(component.shadowRoot.textContent, 'Something Else!')
})

test('resuming a component that renders dynamic content', async (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    message = this.attribute('message')
    template = html`<p>${this.message}</p>`
  }

  const htmlString = serialize(
    html`<wb-hello message="Hello World!"></wb-hello>`,
    {
      components: [Component],
    },
  )

  await useServer(t, 10_100, {
    'index.html': `
      <!doctype html>
      <script type="module" src="/index.js"></script>
      <body>
        ${htmlString}
      </body>
    `,
    'index.js': `
      import {
        html,
        Component as BaseComponent,
        registerComponent
      } from 'watchband/web-component'

      ${Component.toString()}

      registerComponent(window, Component)
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10100')

  t.is(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wb-hello')
        component.setAttribute('message', 'Something Else!')
        const paragraph = component.shadowRoot.firstElementChild
        return paragraph.textContent
      `,
    ),
    'Something Else!',
  )
})

test('server rendering a component that renders per-component-instance styles', async (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-component'
    isGreen = this.signal(false)
    styles = this.isGreen.map(
      (isGreen) => css`
        p {
          color: ${isGreen ? 'green' : 'red'};
        }
      `,
    )
    template = html`<p>Hello World!</p>`
  }

  const htmlString = serialize(html`<wb-component></wb-component>`, {
    components: [Component],
  })

  await useServer(t, 10_108, {
    'index.html': `
      <!doctype html>
      <body>
        ${htmlString}
      </body>
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10108')

  t.is(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wb-component')
        const paragraph = component.shadowRoot.querySelector('p')
        const styles = window.getComputedStyle(paragraph)
        return styles.color
      `,
    ),
    'rgb(255, 0, 0)',
  )
})

test('resuming a component that renders per-component-instance styles', async (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-component'
    isGreen = this.signal(false)
    styles = this.isGreen.map(
      (isGreen) => css`
        p {
          color: ${isGreen ? 'green' : 'red'};
        }
      `,
    )
    template = html`
      <p>Hello World!</p>
      <button
        on:click=${() => {
          this.isGreen.set(true)
        }}
      >
        Make Green
      </button>
    `
  }

  const htmlString = serialize(html`<wb-component></wb-component>`, {
    components: [Component],
  })

  await useServer(t, 10_109, {
    'index.html': `
      <!doctype html>
      <script type="module" src="/index.js"></script>
      <body>
        ${htmlString}
      </body>
    `,
    'index.js': `
      import {
        html,
        css,
        Component as BaseComponent,
        registerComponent
      } from 'watchband/web-component'
      import {makeRender} from 'watchband/html'

      const {capture} = makeRender(window)
      capture()

      ${Component.toString()}

      registerComponent(window, Component)
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10109')

  t.is(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wb-component')
        const paragraph = component.shadowRoot.querySelector('p')
        const styles = window.getComputedStyle(paragraph)
        return styles.color
      `,
    ),
    'rgb(255, 0, 0)',
  )

  await clickElement(await findElement(tab, 'wb-component >>>> button'))

  t.is(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wb-component')
        const paragraph = component.shadowRoot.querySelector('p')
        const styles = window.getComputedStyle(paragraph)
        return styles.color
      `,
    ),
    'rgb(0, 128, 0)',
  )
})

test('rendering a component that takes complex data via property', (t) => {
  const {window} = t.context

  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    data = this.property('data')
    json = this.signal(() => JSON.stringify(this.data.get()))
    template = html`<p>${this.json}</p>`
  }

  class Parent extends BaseComponent {
    static tagName = 'wb-parent'
    data = this.signal({message: 'Hello World!'})
    template = html`<wb-hello prop:data=${this.data}></wb-hello>`
  }

  registerComponent(window, Component)
  registerComponent(window, Parent)

  window.document.body.innerHTML = '<wb-parent></wb-parent>'

  const parent = window.document.querySelector('wb-parent')
  const component = parent.shadowRoot.querySelector('wb-hello')
  t.is(component.shadowRoot.textContent, '{"message":"Hello World!"}')

  component.data = {message: 'Something Else!'}
  t.is(component.shadowRoot.textContent, '{"message":"Something Else!"}')
})

test('resuming a component that takes complex data via property', async (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    data = this.property('data')
    json = this.signal(() => JSON.stringify(this.data.get()))
    template = html`<p>${this.json}</p>`
  }

  class Parent extends BaseComponent {
    static tagName = 'wb-parent'
    data = this.signal({message: 'Hello World!'})
    template = html`<wb-hello prop:data=${this.data}></wb-hello>`
  }

  const htmlString = serialize(html`<wb-parent></wb-parent>`, {
    components: [Component, Parent],
  })

  await useServer(t, 10_106, {
    'index.html': `
      <!doctype html>
      <script type="module" src="/index.js"></script>
      <body>
        ${htmlString}
      </body>
    `,
    'index.js': `
      import {
        html,
        Component as BaseComponent,
        registerComponent
      } from 'watchband/web-component'
      import {makeRender} from 'watchband/html'

      const {capture} = makeRender(window)
      capture()

      ${Component.toString()}
      ${Parent.toString()}

      window.Component = Component
      window.Parent = Parent
      window.registerComponent = registerComponent
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10106')

  {
    const span = await findElement(tab, 'wb-parent >>>> wb-hello >>>> p')
    t.is(span.textContent, '{"message":"Hello World!"}')
  }

  await evalInTab(tab, [], 'window.registerComponent(window, window.Component)')

  {
    const span = await findElement(tab, 'wb-parent >>>> wb-hello >>>> p')
    t.is(span.textContent, '{"message":"Hello World!"}')
  }

  await evalInTab(tab, [], 'window.registerComponent(window, window.Parent)')

  {
    const span = await findElement(tab, 'wb-parent >>>> wb-hello >>>> p')
    t.is(span.textContent, '{"message":"Hello World!"}')
  }
})

test('making a component that reacts to internal events', (t) => {
  const {window} = t.context

  class Counter extends BaseComponent {
    static tagName = 'wb-counter'
    increments = this.observable()
    count = this.signal(
      this.increments.pipe(
        scan((count) => count + 1, 0),
        startWith(0),
      ),
    )
    template = html`
      <div>
        <span>${this.count}</span>
        <button on:click=${this.increments}>Increment</button>
      </div>
    `
  }

  registerComponent(window, Counter)

  window.document.body.innerHTML = '<wb-counter></wb-counter>'

  const counter = window.document.querySelector('wb-counter')
  const span = counter.shadowRoot.querySelector('span')
  const button = counter.shadowRoot.querySelector('button')

  t.is(span.textContent, '0')

  button.click()
  t.is(span.textContent, '1')

  button.click()
  t.is(span.textContent, '2')
})

test('resuming a component that reacts to internal events', async (t) => {
  class Counter extends BaseComponent {
    static tagName = 'wb-counter'
    increments = this.observable()
    count = this.signal(
      this.increments.pipe(
        scan((count) => count + 1, 0),
        startWith(0),
      ),
    )
    template = html`
      <div>
        <span>${this.count}</span>
        <button on:click=${this.increments}>Increment</button>
      </div>
    `
  }

  const htmlString = serialize(html`<wb-counter></wb-counter>`, {
    components: [Counter],
  })

  await useServer(t, 10_101, {
    'index.html': `
      <!doctype html>
      <script type="module" src="/index.js"></script>
      <body>
        ${htmlString}
      </body>
    `,
    'index.js': `
      import {
        html,
        Component as BaseComponent,
        registerComponent
      } from 'watchband/web-component'
      import {makeRender} from 'watchband/html'
      import {scan, startWith} from 'rxjs'

      const {capture} = makeRender(window)
      capture()

      ${Counter.toString()}

      window.Counter = Counter
      window.registerComponent = registerComponent
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10101')

  const button = await findElement(tab, 'wb-counter >>>> button')
  await clickElement(button)
  await clickElement(button)

  await evalInTab(tab, [], 'window.registerComponent(window, window.Counter)')

  {
    const span = await findElement(tab, 'wb-counter >>>> span')
    t.is(span.textContent, '2')
  }

  await clickElement(button)

  {
    const span = await findElement(tab, 'wb-counter >>>> span')
    t.is(span.textContent, '3')
  }
})

test('making a component that emits custom events', (t) => {
  const {window} = t.context

  class Subscriber extends BaseComponent {
    static tagName = 'wb-subscriber'
    increments = this.observable()
    count = this.signal(
      this.increments.pipe(
        map((event) => event.detail.count),
        startWith(0),
      ),
    )
    template = html`
      <div>
        <span>${this.count}</span>
        <wb-counter on:increment=${this.increments}></wb-counter>
      </div>
    `
  }

  class Counter extends BaseComponent {
    static tagName = 'wb-counter'
    incrementClicks = this.observable()
    count = this.signal(
      this.incrementClicks.pipe(
        scan((count) => count + 1, 0),
        startWith(0),
      ),
    )
    increments = this.event(
      'increment',
      this.incrementClicks.pipe(
        map(() => ({
          count: this.count.get(),
        })),
      ),
    )
    template = html`
      <div>
        <span>${this.count}</span>
        <button on:click=${this.incrementClicks}>Increment</button>
      </div>
    `
  }

  registerComponent(window, Subscriber)
  registerComponent(window, Counter)

  window.document.body.innerHTML = '<wb-subscriber></wb-subscriber>'

  const subscriber = window.document.querySelector('wb-subscriber')
  const span = subscriber.shadowRoot.querySelector('span')

  const counter = subscriber.shadowRoot.querySelector('wb-counter')
  const button = counter.shadowRoot.querySelector('button')

  t.is(span.textContent, '0')

  button.click()
  t.is(span.textContent, '1')

  button.click()
  t.is(span.textContent, '2')
})

test('resuming a component that emits custom events', async (t) => {
  class Subscriber extends BaseComponent {
    static tagName = 'wb-subscriber'
    increments = this.observable()
    count = this.signal(
      this.increments.pipe(
        map((event) => event.detail.count),
        startWith(0),
      ),
    )
    template = html`
      <div>
        <span>${this.count}</span>
        <wb-counter on:increment=${this.increments}></wb-counter>
      </div>
    `
  }

  class Counter extends BaseComponent {
    static tagName = 'wb-counter'
    incrementClicks = this.observable()
    count = this.signal(
      this.incrementClicks.pipe(
        scan((count) => count + 1, 0),
        startWith(0),
      ),
    )
    increments = this.event(
      'increment',
      this.incrementClicks.pipe(
        map(() => ({
          count: this.count.get(),
        })),
      ),
    )
    template = html`
      <div>
        <span>${this.count}</span>
        <button on:click=${this.incrementClicks}>Increment</button>
      </div>
    `
  }

  const htmlString = serialize(html`<wb-subscriber></wb-subscriber>`, {
    components: [Subscriber, Counter],
  })

  await useServer(t, 10_105, {
    'index.html': `
      <!doctype html>
      <script type="module" src="/index.js"></script>
      <body>
        ${htmlString}
      </body>
    `,
    'index.js': `
      import {
        html,
        Component as BaseComponent,
        registerComponent
      } from 'watchband/web-component'
      import {makeRender} from 'watchband/html'
      import {map, scan, startWith} from 'rxjs'

      const {capture} = makeRender(window)
      capture()

      ${Subscriber.toString()}
      ${Counter.toString()}

      window.Subscriber = Subscriber
      window.Counter = Counter
      window.registerComponent = registerComponent
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10105')

  const button = await findElement(
    tab,
    'wb-subscriber >>>> wb-counter >>>> button',
  )

  {
    const span = await findElement(tab, 'wb-subscriber >>>> span')
    t.is(span.textContent, '0')
  }

  await clickElement(button)
  await clickElement(button)

  {
    const span = await findElement(tab, 'wb-subscriber >>>> span')
    t.is(span.textContent, '0')
  }

  await evalInTab(tab, [], 'window.registerComponent(window, window.Counter)')

  {
    const span = await findElement(tab, 'wb-subscriber >>>> span')
    t.is(span.textContent, '0')
  }

  await evalInTab(
    tab,
    [],
    'window.registerComponent(window, window.Subscriber)',
  )

  {
    const span = await findElement(tab, 'wb-subscriber >>>> span')
    t.is(span.textContent, '2')
  }
})

test('rendering a component that takes data via dependency injection', (t) => {
  const {window} = t.context

  class Consumer extends BaseComponent {
    static tagName = 'wb-consumer'
    message = this.context('message')
    template = html`<p>${this.message}</p>`
  }

  class Injector extends BaseComponent {
    static tagName = 'wb-injector'
    message = this.context('message', 'Hello World!')
    template = html`<wb-consumer></wb-consumer>`
  }

  registerComponent(window, Consumer)
  registerComponent(window, Injector)

  window.document.body.innerHTML = '<wb-injector></wb-injector>'

  const injector = window.document.querySelector('wb-injector')
  const consumer = injector.shadowRoot.querySelector('wb-consumer')
  t.is(consumer.shadowRoot.textContent, 'Hello World!')
})

test('resuming a component that takes data via dependency injection', async (t) => {
  const {window} = t.context

  class Consumer extends BaseComponent {
    static tagName = 'wb-consumer'
    message = this.context('message')
    template = html`<p>${this.message}</p>`
  }

  class Injector extends BaseComponent {
    static tagName = 'wb-injector'
    message = this.context('message', 'Hello World!')
    template = html`<wb-consumer></wb-consumer>`
  }

  registerComponent(window, Consumer)
  registerComponent(window, Injector)

  const htmlString = serialize(html`<wb-injector></wb-provider>`, {
    components: [Injector, Consumer],
  })

  await useServer(t, 10_107, {
    'index.html': `
      <!doctype html>
      <script type="module" src="/index.js"></script>
      <body>
        ${htmlString}
      </body>
    `,
    'index.js': `
      import {
        html,
        Component as BaseComponent,
        registerComponent,
        captureContext,
      } from 'watchband/web-component'
      import {makeRender} from 'watchband/html'

      const {capture} = makeRender(window)
      capture()
      captureContext(window)

      ${Injector.toString()}
      ${Consumer.toString()}

      window.Injector = Injector
      window.Consumer = Consumer
      window.registerComponent = registerComponent
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10107')

  {
    const p = await findElement(tab, 'wb-injector >>>> wb-consumer >>>> p')
    t.is(p.textContent, 'Hello World!')
  }

  await evalInTab(tab, [], 'window.registerComponent(window, window.Consumer)')

  {
    const p = await findElement(tab, 'wb-injector >>>> wb-consumer >>>> p')
    t.is(p.textContent, 'Hello World!')
  }

  await evalInTab(tab, [], 'window.registerComponent(window, window.Injector)')

  {
    const p = await findElement(tab, 'wb-injector >>>> wb-consumer >>>> p')
    t.is(p.textContent, 'Hello World!')
  }
})

test('rendering a component takes dependencies from outside the DOM', (t) => {
  const {window} = t.context

  class Consumer extends BaseComponent {
    static tagName = 'wb-consumer'
    message = this.context('message')
    template = html`<p>${this.message}</p>`
  }

  registerComponent(window, Consumer)

  const message = new State('Hello World!')

  const provider = new Provider(window)
  provider.listen((key) => {
    if (key === 'message') {
      return message
    }
  })

  window.document.body.innerHTML = '<wb-consumer></wb-consumer>'

  const consumer = window.document.querySelector('wb-consumer')
  t.is(consumer.shadowRoot.textContent, 'Hello World!')

  message.set('Something Else!')
  t.is(consumer.shadowRoot.textContent, 'Something Else!')
})

test('providing dependencies with more concise syntax', (t) => {
  const {window} = t.context

  class Consumer extends BaseComponent {
    static tagName = 'wb-consumer'
    message = this.context('message')
    template = html`<p>${this.message}</p>`
  }

  registerComponent(window, Consumer)

  const message = new State('Hello World!')

  const provider = new Provider(window)
  provider.provide('message', message)

  window.document.body.innerHTML = '<wb-consumer></wb-consumer>'

  const consumer = window.document.querySelector('wb-consumer')
  t.is(consumer.shadowRoot.textContent, 'Hello World!')

  message.set('Something Else!')
  t.is(consumer.shadowRoot.textContent, 'Something Else!')
})

test('requesting a dependency with a signal key', (t) => {
  const {window} = t.context

  class Consumer extends BaseComponent {
    static tagName = 'wb-consumer'
    messageKey = this.attribute('message-key')
    message = this.context(this.messageKey)
    template = html`<p>${this.message}</p>`
  }

  registerComponent(window, Consumer)

  const provider = new Provider(window)
  provider.provide('message1', new State('Hello World!'))
  provider.provide('message2', new State('Something Else!'))

  window.document.body.innerHTML =
    '<wb-consumer message-key="message1"></wb-consumer>'

  const consumer = window.document.querySelector('wb-consumer')
  t.is(consumer.shadowRoot.textContent, 'Hello World!')

  consumer.setAttribute('message-key', 'message2')
  t.is(consumer.shadowRoot.textContent, 'Something Else!')
})
