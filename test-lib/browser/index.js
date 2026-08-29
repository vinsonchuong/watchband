import {closeBrowser, openTab, closeTab} from 'puppet-strings'
import {openChrome} from 'puppet-strings-chrome'

export function useBrowser(test) {
  test.before(async (t) => {
    t.context.browser = await openChrome()
  })

  test.after.always((t) => {
    const {browser} = t.context
    closeBrowser(browser)
  })
}

export async function useBrowserTab(t, url) {
  const {browser} = t.context
  const tab = await openTab(browser, url)
  t.teardown(() => {
    closeTab(tab)
  })
  return tab
}
