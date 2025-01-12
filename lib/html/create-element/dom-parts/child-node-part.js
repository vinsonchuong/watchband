export class ChildNodePart {
  constructor(startSentinelNode, endSentinelNode) {
    this.startSentinelNode = startSentinelNode
    this.endSentinelNode = endSentinelNode
  }

  get value() {
    const nodes = []
    let currentNode = this.startSentinelNode.nextSibling
    while (currentNode !== this.endSentinelNode) {
      nodes.push(currentNode)
      currentNode = currentNode.nextSibling
    }

    return nodes
  }

  set value(nodes) {
    const parentNode = this.startSentinelNode.parentNode
    let currentNode = this.startSentinelNode.nextSibling
    while (currentNode !== this.endSentinelNode) {
      const nodeToRemove = currentNode
      currentNode = currentNode.nextSibling
      parentNode.removeChild(nodeToRemove)
    }

    for (const node of nodes) {
      this.endSentinelNode.parentNode.insertBefore(node, this.endSentinelNode)
    }
  }
}
