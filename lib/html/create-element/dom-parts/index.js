import {AttributePart} from './attribute-part.js'
import {ChildNodePart} from './child-node-part.js'
import {NodePart} from './node-part.js'

export * from './attribute-part.js'
export * from './node-part.js'
export * from './child-node-part.js'

const pattern = /^{(\w+)}$/
const listPattern = /^{(\w+)\[]}$/

export function bindAttributePart(next) {
  return (...args) => {
    const [context, element, attributeName, attributeValue] = args

    if (!pattern.test(attributeValue)) {
      return next(...args)
    }

    const [, partName] = attributeValue.match(pattern)

    const attributePart = new AttributePart(element, attributeName)
    context.parts ||= {}
    context.parts[partName] = attributePart
  }
}

export function bindChildPart(next) {
  return (...args) => {
    const [context, element, child] = args
    const {window} = context

    if (!(typeof child === 'string' && pattern.test(child))) {
      return next(...args)
    }

    const [, partName] = child.match(pattern)

    const node = window.document.createTextNode('')
    element.append(node)

    const part = new NodePart(node)
    context.parts ||= {}
    context.parts[partName] = part
  }
}

export function bindChildListPart(next) {
  return (...args) => {
    const [context, element, child] = args
    const {window} = context

    if (!(typeof child === 'string' && listPattern.test(child))) {
      return next(...args)
    }

    const [, partName] = child.match(listPattern)

    const startNode = window.document.createTextNode('')
    const endNode = window.document.createTextNode('')
    element.append(startNode, endNode)

    const part = new ChildNodePart(startNode, endNode)
    context.parts ||= {}
    context.parts[partName] = part
  }
}
