export class AttributePart {
  constructor(element, attribute) {
    this.element = element
    this.attribute = attribute
  }

  get value() {
    return this.element.getAttribute(this.attribute)
  }

  set value(value) {
    this.element.setAttribute(this.attribute, value)
  }
}
