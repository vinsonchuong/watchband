export function setAttribute(next) {
  return (...args) => {
    const [_, element, attributeName, attributeValue] = args

    if (!(typeof attributeValue === 'string')) {
      return next(...args)
    }

    element.setAttribute(attributeName, attributeValue)
  }
}
