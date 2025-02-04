import {isSignal, effect} from '../../signal/index.js'
import {ChildNodePart} from './dom-parts/child-node-part.js'
import {NodePart} from './dom-parts/node-part.js'

export function bindAttributeSignal(next) {
  return (...args) => {
    const [{bindings}, element, attributeName, attributeValue] = args
    if (!isSignal(attributeValue)) {
      return next(...args)
    }

    const binding = {
      connect() {
        this.disconnect = effect(() => {
          element.setAttribute(attributeName, attributeValue.get())
        })
      },
    }

    bindings.push(binding)
  }
}

export function bindChildSignal(next) {
  return (...args) => {
    const [{window, bindings}, element, child] = args

    if (!isSignal(child)) {
      return next(...args)
    }

    const node = window.document.createTextNode('')
    element.append(node)
    const part = new NodePart(node)

    const binding = {
      connect() {
        let template

        const cleanupEffect = effect(() => {
          const value = child.get()

          if (template && value !== template) {
            for (const binding of template.bindings) {
              binding.disconnect()
            }
          }

          if (value?.element) {
            template = value
            part.value = template.element
          } else {
            part.value = value
          }
        })

        this.disconnect = () => {
          cleanupEffect()

          if (template) {
            for (const binding of template.bindings) {
              binding.disconnect()
            }
          }
        }
      },
    }

    bindings.push(binding)
  }
}

export function bindChildListSignal(next) {
  return (...args) => {
    const [{window, bindings}, element, child] = args

    if (!(isSignal(child) && Array.isArray(child.get()))) {
      return next(...args)
    }

    const startNode = window.document.createTextNode('')
    const endNode = window.document.createTextNode('')
    element.append(startNode, endNode)

    const part = new ChildNodePart(startNode, endNode)

    const binding = {
      connect() {
        let templates

        const cleanupEffect = effect(() => {
          const value = child.get()

          if (templates) {
            const templatesSet = new Set(templates)
            const newTemplatesSet = new Set(value)

            for (const template of templatesSet.difference(newTemplatesSet)) {
              for (const binding of template.bindings) {
                binding.disconnect()
              }
            }
          }

          if (value.every((v) => Boolean(v?.element))) {
            templates = value
            part.value = templates.map((t) => t.element)
          } else {
            part.value = value
          }
        })

        this.disconnect = () => {
          cleanupEffect()

          if (templates) {
            for (const template of templates) {
              for (const binding of template.bindings) {
                binding.disconnect()
              }
            }
          }
        }
      },
    }

    bindings.push(binding)
  }
}
