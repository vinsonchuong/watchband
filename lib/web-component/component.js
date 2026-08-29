import {Subject} from 'rxjs'
import {isObservable} from '../observable/index.js'
import {RenderState, ComputedRenderState} from './signal.js'

export class Component {
  window
  static cachedMetadata

  // TODO: Clean this up
  static get metadata() {
    if (!this.cachedMetadata) {
      const component = new this(null)
      this.cachedMetadata = component.metadata
    }

    return this.cachedMetadata
  }

  static get attributes() {
    return Object.keys(this.metadata.attributes)
  }

  static get properties() {
    return Object.keys(this.metadata.properties)
  }

  metadata = {
    attributes: {},
    properties: {},
    context: {
      provider: {},
      consumer: new Map(),
    },
    globalEvents: {
      window: {},
      document: {},
    },
  }

  constructor(element) {
    this.element = element
  }

  signal(value) {
    if (typeof value === 'function') {
      return new ComputedRenderState(value)
    }

    if (isObservable(value)) {
      const signal = new RenderState()
      value.subscribe((current) => {
        signal.set(current)
      })
      return signal
    }

    return new RenderState(value)
  }

  observable() {
    return new Subject()
  }

  attribute(name) {
    const signal = new RenderState()
    this.metadata.attributes[name] = signal
    return signal
  }

  property(name) {
    const signal = new RenderState()
    this.metadata.properties[name] = signal
    return signal
  }

  event(type, ...observables) {
    const subject = new Subject()

    for (const observable of observables) {
      observable.subscribe(subject)
    }

    subject.subscribe((data) => {
      const window = this.element.ownerDocument.defaultView

      this.element.dispatchEvent(
        new window.CustomEvent(type, {
          bubbles: true,
          composed: true,
          detail: data,
        }),
      )
    })

    return subject
  }

  context(key, value) {
    if (Object.is(value, undefined)) {
      const signal = new RenderState()
      this.metadata.context.consumer.set(key, signal)
      return signal
    }

    const signal = new RenderState(value)
    this.metadata.context.provider[key] = signal
    return signal
  }

  windowEvent(type) {
    const observable = new Subject()
    this.metadata.globalEvents.window[type] = observable
    return observable
  }

  documentEvent(type) {
    const observable = new Subject()
    this.metadata.globalEvents.document[type] = observable
    return observable
  }
}
