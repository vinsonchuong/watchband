export class NodePart {
  constructor(node) {
    this.node = node
  }

  get value() {
    const window = this.node.ownerDocument.defaultView
    return this.node instanceof window.Text ? this.node.data : this.node
  }

  set value(value) {
    const document = this.node.ownerDocument
    const window = document.defaultView

    if (typeof value === 'string' || typeof value === 'number') {
      if (this.node instanceof window.Text) {
        this.node.data = value.toString()
      } else {
        const newNode = document.createTextNode(value.toString())
        this.node.parentNode.replaceChild(newNode, this.node)
        this.node = newNode
      }
    } else if (value instanceof window.Node) {
      this.node.parentNode.replaceChild(value, this.node)
      this.node = value
    }
  }
}
