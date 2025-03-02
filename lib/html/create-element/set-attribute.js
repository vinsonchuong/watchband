import {AttributePart} from './dom-parts/index.js'

export function setAttribute(next) {
  return (...args) => {
    const [_, element, attributeName, attributeValue] = args

    if (
      !(
        typeof attributeValue === 'string' ||
        typeof attributeValue === 'boolean'
      )
    ) {
      return next(...args)
    }

    const attributePart = new AttributePart(element, attributeName)
    attributePart.value = attributeValue
  }
}
