import htm from 'htm/mini'
import {chain} from '../strategy/index.js'
import {createElement, createFragment} from './create-element/index.js'

export * from './create-element/index.js'

export function makeHtml(
  window,
  createElementStrategy = chain(createElement),
  createFragmentStrategy = chain(createFragment),
) {
  return function html(strings, ...values) {
    const context = {
      window,
      html,
      template: {strings, values},
      bindings: [],
      connect() {
        for (const binding of this.bindings) {
          binding.connect()
        }
      },
      disconnect() {
        for (const binding of this.bindings) {
          binding.disconnect()
        }
      },
    }
    const parse = htm.bind((tag, attributes, ...children) => {
      return createElementStrategy(context, tag, attributes ?? {}, children)
    })

    const parseResult = parse(strings, ...values)

    if (Array.isArray(parseResult)) {
      context.element = createFragmentStrategy(context, parseResult)
    } else if (parseResult instanceof window.Node) {
      context.element = parseResult
    } else {
      context.element = createFragmentStrategy(context, [parseResult])
    }

    context.connect()

    return context
  }
}
