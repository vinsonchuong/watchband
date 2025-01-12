import {fromEvent} from 'rxjs'
import {isObserver} from '../../observable/index.js'

const pattern = /{(\w+)}/

export function bindEventPart(next) {
  return (...args) => {
    const [context, element, attributeName, attributeValue] = args

    if (
      !(
        attributeName.startsWith('on:') &&
        typeof attributeValue === 'string' &&
        pattern.test(attributeValue)
      )
    ) {
      return next(...args)
    }

    const eventName = attributeName.slice(3)
    const observable = fromEvent(element, eventName)
    const partName = attributeValue.match(/{(\w+)}/)[1]
    context.events ||= {}
    context.events[partName] = observable
  }
}

export function bindEventObserver(next) {
  return (...args) => {
    const [{bindings}, element, attributeName, attributeValue] = args

    if (!(attributeName.startsWith('on:') && isObserver(attributeValue))) {
      return next(...args)
    }

    const eventName = attributeName.slice(3)
    const observable = fromEvent(element, eventName)
    const binding = {
      connect() {
        const subscription = observable.subscribe(attributeValue)
        this.disconnect = () => {
          subscription.unsubscribe()
        }
      },
    }

    bindings.push(binding)
  }
}
