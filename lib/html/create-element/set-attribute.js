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

    if (attributeName.startsWith('prop:')) {
      const propertyName = attributeName.slice(5)
      element[propertyName] = attributeValue
    } else {
      element.setAttribute(attributeName, attributeValue)
    }
  }
}
