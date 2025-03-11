import {AttributePart} from './dom-parts/index.js'

export function setAttribute() {
  return (...args) => {
    const [_, element, attributeName, attributeValue] = args

    const attributePart = new AttributePart(element, attributeName)
    attributePart.value = attributeValue
  }
}
