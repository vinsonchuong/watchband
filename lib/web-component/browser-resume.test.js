import {setTimeout} from 'node:timers/promises'
import test from 'ava'
import {openChrome} from 'puppet-strings-chrome'
import {closeBrowser, openTab, closeTab, evalInTab} from 'puppet-strings'
import {serveFixture} from '../fixtures/index.js'

test.before(async (t) => {
  t.context.browser = await openChrome()
})

test.after.always((t) => {
  const {browser} = t.context
  closeBrowser(browser)
})

test('resuming a static component in the browser', async (t) => {
  const {browser} = t.context

  await serveFixture(t, {
    port: 10_000,
    path: 'lib/web-component/server-rendering-fixtures/static',
  })

  const tab = await openTab(browser, 'http://localhost:10000')
  t.teardown(() => {
    closeTab(tab)
  })

  t.deepEqual(
    await evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wc-component')
        const paragraph = component.shadowRoot.querySelector('p')
        return {
          textContent: paragraph.textContent,
          color: window.getComputedStyle(paragraph)['color']
        }
      `,
    ),
    {
      textContent: 'Hello World!',
      color: 'rgb(255, 0, 0)',
    },
  )
})

test('resuming a component that uses signals', async (t) => {
  const {browser} = t.context

  await serveFixture(t, {
    port: 10_001,
    path: 'lib/web-component/server-rendering-fixtures/signals',
  })

  const tab = await openTab(browser, 'http://localhost:10001')
  t.teardown(() => {
    closeTab(tab)
  })

  async function readText() {
    return evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wc-component')
        const paragraph = component.shadowRoot.querySelector('p')
        return paragraph.textContent
      `,
    )
  }

  t.is(await readText(), 'Hello World!')

  const abortSignal = AbortSignal.timeout(5000)
  while (!abortSignal.aborted) {
    await setTimeout(100)

    const defined = await evalInTab(
      tab,
      [],
      `
        const webComponent = document.querySelector('wc-component')
        return !!webComponent.component
      `,
    )

    if (defined) {
      break
    }
  }

  if (abortSignal.aborted) {
    console.log(tab)
    return t.fail('wc-component was not defined within 5s')
  }

  await evalInTab(
    tab,
    [],
    `
      const webComponent = document.querySelector('wc-component')
      webComponent.component.message.set('Updated Message!')
    `,
  )

  t.is(await readText(), 'Updated Message!')
})

test('resuming a component that uses events', async (t) => {
  const {browser} = t.context

  await serveFixture(t, {
    port: 10_002,
    path: 'lib/web-component/server-rendering-fixtures/events',
  })

  const tab = await openTab(browser, 'http://localhost:10002')
  t.teardown(() => {
    closeTab(tab)
  })

  async function readText() {
    return evalInTab(
      tab,
      [],
      `
        const component = document.querySelector('wc-component')
        const paragraph = component.shadowRoot.querySelector('p')
        return paragraph.textContent
      `,
    )
  }

  t.is(await readText(), '0')

  const abortSignal = AbortSignal.timeout(5000)
  while (!abortSignal.aborted) {
    await setTimeout(100)

    const defined = await evalInTab(
      tab,
      [],
      `
        const webComponent = document.querySelector('wc-component')
        return !!webComponent.component
      `,
    )

    if (defined) {
      break
    }
  }

  await evalInTab(
    tab,
    [],
    `
      const webComponent = document.querySelector('wc-component')
      webComponent.shadowRoot.querySelector('button:nth-child(2)').click()
    `,
  )
  t.is(await readText(), '1')

  await evalInTab(
    tab,
    [],
    `
      const webComponent = document.querySelector('wc-component')
      webComponent.shadowRoot.querySelector('button:nth-child(3)').click()
    `,
  )
  t.is(await readText(), '0')
})
