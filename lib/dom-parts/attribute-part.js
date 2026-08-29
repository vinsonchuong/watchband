export class AttributePart {
  constructor(element, attribute) {
    this.element = element
    this.attribute = attribute

    this.property = attribute.startsWith('prop:') ? attribute.slice(5) : null
  }

  get value() {
    if (this.property) {
      return this.element[this.property]
    }

    return this.element.getAttribute(this.attribute)
  }

  set value(value) {
    if (this.property) {
      this.element[this.property] = value
    } else if (Object.is(value, null)) {
      this.element.removeAttribute(this.attribute)
    } else {
      if (this.value === value) {
        console.warn('Setting part to same value', this.attribute, value)
      }

      this.element.setAttribute(this.attribute, value)
    }
  }
}
