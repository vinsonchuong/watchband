import {
  AttributePart as BaseAttributePart,
  ChildNodePart as BaseChildNodePart,
  EventPart as BaseEventPart,
} from '../dom-parts/index.js'
import {isSignal, effect} from '../signal/index.js'
import {isObserver} from '../observable/index.js'
import {HtmlTemplate} from './template.js'

export class AttributePart extends BaseAttributePart {
  #unbind = null

  bind(object) {
    if (isSignal(object)) {
      this.#unbind = effect(() => {
        const newValue = object.get()
        if (!Object.is(newValue, undefined)) {
          this.value = newValue
        }
      })
    }
  }

  unbind() {
    if (this.#unbind) {
      this.#unbind()
    }
  }
}

export class ChildNodePart extends BaseChildNodePart {
  static render = null
  #unbind = null
  #renderCache = new WeakMap()
  parts = {}

  render(template) {
    if (this.#renderCache.has(template)) {
      return this.#renderCache.get(template)
    }

    const result = this.constructor.render(template)
    result.fragmentNodes = Array.from(result.fragment.childNodes)
    this.#renderCache.set(template, result)
    return result
  }

  bind(object) {
    if (isSignal(object)) {
      this.#unbind = effect(() => {
        const newValue = object.get()
        if (!Object.is(newValue, undefined)) {
          this.value = newValue
        }
      })
    }
  }

  unbind() {
    if (this.#unbind) {
      this.#unbind()
    }
  }

  get value() {
    return super.value
  }

  set value(value) {
    if (value instanceof HtmlTemplate) {
      const result = this.render(value)
      super.value = result.fragmentNodes
      this.parts = result.parts
      this.singleNode = false
    } else if (
      Array.isArray(value) &&
      value.every((v) => v instanceof HtmlTemplate)
    ) {
      this.singleNode = false
      super.value = value.flatMap((v) => {
        const result = this.render(v)
        Object.assign(this.parts, result.parts)
        return result.fragmentNodes
      })
    } else {
      super.value = value
    }
  }
}

export class EventPart extends BaseEventPart {
  #unbind = null

  constructor(element, type) {
    super(element, type)
    this.attribute = `on:${type}`
  }

  bind(object) {
    if (!isObserver(object)) {
      return
    }

    const subscription = this.observable.subscribe(object)
    this.#unbind = () => {
      subscription.unsubscribe()
    }
  }

  unbind() {
    if (this.#unbind) {
      this.#unbind()
    }
  }
}
