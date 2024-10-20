import htm from 'htm/mini'
import {svgTagNames} from 'svg-tag-names'
import {htmlTagNames} from 'html-tag-names'
import {fromEvent} from 'rxjs'
import {isSignal, effect} from '../signal/index.js'
import {isObserver} from '../observable/index.js'
import {AttributePart, NodePart} from './dom-parts.js'

const svgTagLookup = new Set(svgTagNames)
for (const htmlTag of htmlTagNames) {
  svgTagLookup.delete(htmlTag)
}

svgTagLookup.add('svg')

export function makeHtml(window, config = {}) {
  const transform = config.transform ?? ((x) => x)

  return function (...args) {
    const parts = {}
    const events = {}
    const hooks = []

    const parse = htm.bind((tag, attributes, ...children) => {
      attributes ||= {}
      ;({
        tag = tag,
        attributes = attributes,
        children = children,
      } = transform({tag, attributes, children}))

      const element = svgTagLookup.has(tag)
        ? window.document.createElementNS('http://www.w3.org/2000/svg', tag)
        : window.document.createElement(tag)

      for (const [attribute, value] of Object.entries(attributes)) {
        const isEvent = attribute.startsWith('on:')
        const valueIsString = typeof value === 'string'
        const partMatch = valueIsString ? value.match(/{(\w+)}/) : null

        if (isSignal(value)) {
          const hook = {
            connect() {
              this.disconnect = effect(() => {
                element.setAttribute(attribute, value.get())
              })
            },
          }
          hook.connect()
          hooks.push(hook)
        } else if (isEvent) {
          const eventName = attribute.slice(3)
          const observable = fromEvent(element, eventName)

          if (partMatch) {
            const partName = partMatch[1]
            events[partName] = observable
          } else if (isObserver(value)) {
            const hook = {
              connect() {
                const subscription = observable.subscribe(value)
                this.disconnect = () => {
                  subscription.unsubscribe()
                }
              },
            }
            hook.connect()
            hooks.push(hook)
          }
        } else if (partMatch) {
          const partName = partMatch[1]
          parts[partName] = new AttributePart(element, attribute)
        } else if (valueIsString) {
          element.setAttribute(attribute, value)
        }
      }

      for (const child of children) {
        const childIsString = typeof child === 'string'
        const partMatch = childIsString ? child.match(/{(\w+)}/) : null
        const childIsSignal = isSignal(child)

        if (partMatch || childIsSignal) {
          const node = window.document.createTextNode('')
          const part = new NodePart(node)
          element.append(node)

          if (partMatch) {
            const partName = partMatch[1]
            parts[partName] = part
          }

          if (childIsSignal) {
            const hook = {
              connect() {
                this.disconnect = effect(() => {
                  part.value = child.get()
                })
              },
            }
            hook.connect()
            hooks.push(hook)
          }
        } else if (
          child instanceof window.Node ||
          childIsString ||
          typeof child === 'number'
        ) {
          element.append(child)
        }
      }

      return element
    })

    const element = parse(...args)
    return {
      element,
      parts,
      events,
      connect() {
        for (const hook of hooks) {
          hook.connect()
        }
      },
      disconnect() {
        for (const hook of hooks) {
          hook.disconnect()
        }
      },
    }
  }
}
