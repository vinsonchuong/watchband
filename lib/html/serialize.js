import {parseHTML} from 'linkedom'
import {makeRender} from './html.js'
import {findAllShadowRoots} from './shadow-roots.js'

export function serialize(template, {beforeRender = () => {}} = {}) {
  const {window, document} = parseHTML(
    '<!doctype html><html><head></head><body></body></html>',
  )

  beforeRender(window)

  const {render} = makeRender(window)
  const {fragment} = render(template)
  document.body.append(fragment)

  const roots = findAllShadowRoots(window)

  while (roots.length > 0) {
    const root = roots.pop()

    const templateElement = document.createElement('template')
    templateElement.setAttribute('shadowrootmode', 'open')
    templateElement.innerHTML = root.innerHTML

    root.host.prepend(templateElement)
  }

  return document.body.innerHTML
}
