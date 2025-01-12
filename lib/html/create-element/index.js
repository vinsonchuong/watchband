import {chain} from '../../strategy/index.js'
import {createElementFromTag, isTag} from './html-tags.js'
import {
  bindAttributeSignal,
  bindChildListSignal,
  bindChildSignal,
} from './signals.js'
import {
  bindAttributePart,
  bindChildListPart,
  bindChildPart,
} from './dom-parts/index.js'
import {bindEventObserver, bindEventPart} from './observables.js'
import {setAttribute} from './set-attribute.js'
import {appendChild} from './append-child.js'

export const bindAttribute = chain(
  bindAttributeSignal,
  bindEventPart,
  bindEventObserver,
  bindAttributePart,
  setAttribute,
)

export const bindChild = chain(
  bindChildListSignal,
  bindChildSignal,
  bindChildPart,
  bindChildListPart,
  appendChild,
)

export {createElementFromTag, isTag} from './html-tags.js'
export {bindAttributeSignal, bindChildSignal} from './signals.js'
export {bindAttributePart, bindChildPart} from './dom-parts/index.js'
export {bindEventObserver, bindEventPart} from './observables.js'
export {setAttribute} from './set-attribute.js'
export {appendChild} from './append-child.js'

export function configureCreateElement(bindAttribute, bindChild) {
  return (next) =>
    (...args) => {
      const [context, tag, attributes, children] = args
      const {window} = context

      if (!isTag(window, tag)) {
        return next(...args)
      }

      const element = createElementFromTag(window, tag)

      for (const [attribute, value] of Object.entries(attributes)) {
        bindAttribute(context, element, attribute, value)
      }

      for (const child of children) {
        bindChild(context, element, child)
      }

      return element
    }
}

export const createElement = configureCreateElement(bindAttribute, bindChild)

export function configureCreateFragment(bindChild) {
  return () =>
    (...args) => {
      const [context, children] = args
      const {window} = context

      const fragment = new window.DocumentFragment()

      if (Array.isArray(children)) {
        for (const child of children) {
          bindChild(context, fragment, child)
        }
      } else {
        bindChild(context, fragment, children)
      }

      return fragment
    }
}

export const createFragment = configureCreateFragment(bindChild)
