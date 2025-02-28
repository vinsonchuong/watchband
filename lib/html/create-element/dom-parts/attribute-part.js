export class AttributePart {
  constructor(element, attribute) {
    this.element = element
    this.attribute = attribute
    this.property = attribute.startsWith('prop:') ? attribute.slice(5) : null
  }

  get value() {
    return this.property
      ? this.element[this.property]
      : this.element.getAttribute(this.attribute)
  }

  set value(value) {
    if (this.property) {
      this.element[this.property] = value
    } else {
      this.element.setAttribute(this.attribute, value)
    }
  }
}
