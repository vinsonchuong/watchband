import test from 'ava'
import {evalInTab} from 'puppet-strings'
import {useBrowser, useBrowserTab} from '../../test-lib/browser/index.js'
import {useServer} from '../../test-lib/http/index.js'
import {serialize} from './serialize.js'
import {Component as BaseComponent, html, css} from './index.js'

useBrowser(test)

test('serializing a component that renders static content', (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    template = html`<p>Hello World!</p>`
  }

  t.is(
    serialize(html`<wb-hello></wb-hello>`, {
      components: [Component],
    }),
    [
      '<wb-hello>',
      '<template shadowrootmode="open">',
      '<p>Hello World!</p>',
      '</template>',
      '</wb-hello>',
    ].join(''),
  )
})

test('serializing a component that renders styles', (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    static styles = css`
      p {
        color: pink;
      }
    `
    template = html`<p>Hello World!</p>`
  }

  t.is(
    serialize(html`<wb-hello></wb-hello>`, {
      components: [Component],
    }),
    [
      '<wb-hello>',
      '<template shadowrootmode="open">',
      '<style>p{color:pink}</style>',
      '<p>Hello World!</p>',
      '</template>',
      '</wb-hello>',
    ].join(''),
  )
})

test('serializing a component that renders dynamic content', (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    message = this.attribute('message')
    template = html`<p>${this.message}</p>`
  }

  t.is(
    serialize(html`<wb-hello message="Hello World!"></wb-hello>`, {
      components: [Component],
    }),
    [
      '<wb-hello message="Hello World!">',
      '<template shadowrootmode="open">',
      '<p><!--child-node-part 0-->Hello World!<!--/child-node-part--></p>',
      '</template>',
      '</wb-hello>',
    ].join(''),
  )
})

test('serializing a component that renders per-component instance styles', (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
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

  t.is(
    serialize(html`<wb-hello message="Hello World!"></wb-hello>`, {
      components: [Component],
    }),
    [
      '<wb-hello message="Hello World!">',
      '<template shadowrootmode="open">',
      '<style data-instance>p{color:red}</style>',
      '<p>Hello World!</p>',
      '</template>',
      '</wb-hello>',
    ].join(''),
  )
})

test('serializing a component that takes data via dependency injection', (t) => {
  class Consumer extends BaseComponent {
    static tagName = 'wb-consumer'
    message = this.context('message')
    template = html`<p>${this.message}</p>`
  }

  t.is(
    serialize(html`<wb-consumer></wb-consumer>`, {
      components: [Consumer],
      context: {
        message: 'Hello World!',
      },
    }),
    [
      '<wb-consumer>',
      '<template shadowrootmode="open">',
      '<p><!--child-node-part 0-->Hello World!<!--/child-node-part--></p>',
      '</template>',
      '</wb-consumer>',
    ].join(''),
  )
})

test('serializing a component that requests a dependency with a signal key', (t) => {
  class Consumer extends BaseComponent {
    static tagName = 'wb-consumer'
    messageKey = this.attribute('message-key')
    message = this.context(this.messageKey)
    template = html`<p>${this.message}</p>`
  }

  t.is(
    serialize(html`<wb-consumer message-key="message1"></wb-consumer>`, {
      components: [Consumer],
      context: {
        message1: 'Hello World!',
      },
    }),
    [
      '<wb-consumer message-key="message1">',
      '<template shadowrootmode="open">',
      '<p><!--child-node-part 0-->Hello World!<!--/child-node-part--></p>',
      '</template>',
      '</wb-consumer>',
    ].join(''),
  )
})

test('resuming a component that renders static content', async (t) => {
  class Component extends BaseComponent {
    static tagName = 'wb-hello'
    template = html`<p>Hello World!</p>`
  }

  const htmlString = serialize(html`<wb-hello></wb-hello>`, {
    components: [Component],
  })

  await useServer(t, 10_000, {
    'index.html': `
      <!doctype html>
      <body>
        ${htmlString}
      </body>
    `,
  })

  const tab = await useBrowserTab(t, 'http://localhost:10000')

  t.is(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wb-hello')
        const paragraph = component.shadowRoot.firstElementChild
        return paragraph.textContent
      `,
    ),
    'Hello World!',
  )
})
