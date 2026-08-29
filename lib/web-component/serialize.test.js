import test from 'ava'
import {evalInTab} from 'puppet-strings'
import {useBrowser, useBrowserTab} from '../../test-lib/browser/index.js'
import {useServer} from '../../test-lib/http/index.js'
import {serialize} from './serialize.js'
import {Component as BaseComponent, html} from './index.js'

useBrowser(test)

test('serializing a component that renders static content', async (t) => {
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
