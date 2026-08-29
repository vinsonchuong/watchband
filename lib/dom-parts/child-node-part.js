import DS from 'diff-sequences'

const {default: diff} = DS

export class ChildNodePart {
  singleNode = false
  startSentinelNode
  endSentinelNode

  constructor(parent, previousSibling, nextSibling) {
    this.parent = parent
    this.previousSibling = previousSibling
    this.nextSibling = nextSibling

    this.addSentinelNodes()
  }

  addSentinelNodes() {
    const document = this.parent.ownerDocument

    this.startSentinelNode = document.createComment('child-node-part')
    this.endSentinelNode = document.createComment('/child-node-part')

    this.parent.insertBefore(
      this.startSentinelNode,
      this.previousSibling
        ? this.previousSibling.nextSibling
        : this.parent.firstChild,
    )

    this.parent.insertBefore(this.endSentinelNode, this.nextSibling ?? null)
  }

  get value() {
    if (this.singleNode) {
      return this.startSentinelNode.nextSibling === this.endSentinelNode
        ? null
        : this.startSentinelNode.nextSibling
    }

    const nodes = []

    let currentNode = this.startSentinelNode.nextSibling
    while (currentNode !== this.endSentinelNode) {
      nodes.push(currentNode)
      currentNode = currentNode.nextSibling
    }

    return nodes
  }

  set value(value) {
    const document = this.startSentinelNode.ownerDocument
    const window = document.defaultView
    const parent = this.startSentinelNode.parentNode

    if (
      !Array.isArray(value) &&
      (!(value instanceof window.DocumentFragment) ||
        value.childNodes.length === 1)
    ) {
      this.singleNode = true
    }

    const values = Array.isArray(value) ? value : [value]
    const newNodes = values.map((nodeOrText) =>
      nodeOrText instanceof window.Node
        ? nodeOrText
        : document.createTextNode(nodeOrText),
    )

    // Remove nodes
    {
      const nodeLookup = new Set(newNodes)
      let currentNode = this.startSentinelNode.nextSibling
      while (currentNode !== this.endSentinelNode) {
        const nextNode = currentNode.nextSibling

        if (!nodeLookup.has(currentNode)) {
          parent.removeChild(currentNode)
        }

        currentNode = nextNode
      }
    }

    // Compute mutations
    {
      const currentNodes = []
      let currentNode = this.startSentinelNode.nextSibling
      while (currentNode !== this.endSentinelNode) {
        currentNodes.push(currentNode)
        currentNode = currentNode.nextSibling
      }

      const currentNodesLookup = new Set(currentNodes)

      const unchangedNodesLookup = new Set()
      diff(
        currentNodes.length,
        newNodes.length,
        (a, b) => currentNodes[a] === newNodes[b],
        (n, a) => {
          for (; n > 0; n -= 1, a += 1) {
            unchangedNodesLookup.add(currentNodes[a])
          }
        },
      )

      for (let i = newNodes.length - 1; i >= 0; i--) {
        const node = newNodes[i]
        const nextNode = newNodes[i + 1] || this.endSentinelNode

        if (!currentNodesLookup.has(node) || !unchangedNodesLookup.has(node)) {
          // eslint-disable-next-line unicorn/prefer-modern-dom-apis
          parent.insertBefore(node, nextNode)
        }
      }
    }

    // Old Code
    // const firstInsertedNode =
    //   nodes[0] instanceof window.DocumentFragment
    //     ? nodes[0].firstChild
    //     : nodes[0]
    //
    // for (const node of nodes) {
    //   parent.insertBefore(node, this.endSentinelNode)
    // }
    //
    // const endNode = firstInsertedNode ?? this.endSentinelNode
    // let currentNode = this.startSentinelNode.nextSibling
    // while (currentNode !== endNode) {
    //   const nodeToRemove = currentNode
    //   currentNode = currentNode.nextSibling
    //   parent.removeChild(nodeToRemove)
    // }
  }
}
