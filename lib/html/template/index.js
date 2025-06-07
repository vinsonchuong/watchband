import {Signal} from 'signal-polyfill'
import {chain} from '../../strategy/index.js'
import {isSignal, Computed} from '../../signal/index.js'
import {
  makeCss,
  makeHtml,
  configureCreateElement,
  configureCreateFragment,
  bindChildPlugins as baseBindChildPlugins,
  bindAttribute,
} from '../index.js'
import {HtmlTemplate, CssTemplate} from './template.js'

export * from './template.js'

export const bindChildPlugins = [
  (next) => (context, element, child) => {
    const {html} = context

    function processTemplate(obj) {
      if (obj instanceof HtmlTemplate) {
        return html(obj.strings, ...obj.values)
      }

      return obj
    }

    if (isSignal(child)) {
      const wrappedChild = new Computed(() => {
        const obj = child.get()
        return Signal.subtle.untrack(() =>
          Array.isArray(obj)
            ? obj.map((obj) => processTemplate(obj))
            : processTemplate(obj),
        )
      })

      return next(context, element, wrappedChild)
    }

    if (Array.isArray(child)) {
      const wrappedChild = child.map((obj) => processTemplate(obj))
      return next(context, element, wrappedChild)
    }

    const wrappedChild = processTemplate(child)
    return next(context, element, wrappedChild)
  },
]

export const bindChild = chain(...bindChildPlugins, ...baseBindChildPlugins)
export const createElement = configureCreateElement(bindAttribute, bindChild)
export const createFragment = configureCreateFragment(bindChild)

export function makeRender(
  window,
  {
    createElementStrategy = chain(createElement),
    createFragmentStrategy = chain(createFragment),
  } = {},
) {
  const html = makeHtml(window, createElementStrategy, createFragmentStrategy)
  const css = makeCss(window)

  return (template) => {
    if (template instanceof HtmlTemplate) {
      return html(template.strings, ...template.values)
    }

    if (template instanceof CssTemplate) {
      return css(template.strings, ...template.values)
    }

    throw new Error('Invalid template')
  }
}
