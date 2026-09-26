import * as domhandler from 'domhandler'
import {appendChild, prependChild, removeElement, append} from 'domutils'

export class Comment extends domhandler.Comment {
  get previousSibling() {
    return this.prev
  }

  get nextSibling() {
    return this.next
  }

  remove() {
    removeElement(this)
  }

  after = after
}

export class Text extends domhandler.Text {
  get previousSibling() {
    return this.prev
  }

  get nextSibling() {
    return this.next
  }

  remove() {
    removeElement(this)
  }

  after = after
}

export class Element extends domhandler.Element {
  parts = {
    attributes: {},
  }

  constructor(tagName) {
    super(tagName, {}, [], 'tag')
  }

  get tagName() {
    return this.name
  }

  get previousSibling() {
    return this.prev
  }

  get nextSibling() {
    return this.next
  }

  setAttribute(name, value) {
    this.attribs[name] = value
  }

  remove() {
    removeElement(this)
  }

  after = after

  prepend(...nodesOrStrings) {
    for (const nodeOrString of nodesOrStrings.toReversed()) {
      const node =
        typeof nodeOrString === 'string' ? new Text(nodeOrString) : nodeOrString

      if (!node) {
        continue
      }

      prependChild(this, node)
    }
  }

  append(...nodesOrStrings) {
    for (const nodeOrString of nodesOrStrings) {
      const node =
        typeof nodeOrString === 'string' ? new Text(nodeOrString) : nodeOrString

      if (!node) {
        continue
      }

      appendChild(this, node)
    }
  }
}

function after(...nodesOrStrings) {
  let currentNode = this

  for (const nodeOrString of nodesOrStrings) {
    const node =
      typeof nodeOrString === 'string' ? new Text(nodeOrString) : nodeOrString

    if (!node) {
      continue
    }

    append(currentNode, node)
    currentNode = node
  }
}
