import {State, Computed, isSignal} from 'watchband/signal'

export class Actor {
  #window
  #provider

  constructor({provider, ...dependencies}) {
    this.#window = dependencies.window
    this.#provider = provider
    Object.assign(this, dependencies)
  }

  context(key, value) {
    if (Object.is(value, undefined)) {
      const response = this.#provider.get(key)
      if (!response) {
        throw new Error(`Provider cannot provide ${key}`)
      }

      return response
    }

    const signal = isSignal(value)
      ? value
      : typeof value === 'function'
        ? new Computed(value)
        : new State(value)

    this.#provider.provide(key, signal)

    return signal
  }

  event(name, handler) {
    this.#window.addEventListener(name, (event) => {
      handler(event.detail)
    })

    return handler
  }
}
