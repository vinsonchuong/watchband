export class Provider {
  #listeners = []
  #context = {}

  constructor(window) {
    window.addEventListener('context-request', (event) => {
      const {context: key, callback} = event.detail

      const response = this.get(key)
      if (!Object.is(response, undefined)) {
        event.stopImmediatePropagation()
        callback(response)
      }
    })
  }

  listen(callback) {
    this.#listeners.push(callback)
  }

  provide(key, signal) {
    this.#context[key] = signal
  }

  get(key) {
    if (Object.hasOwn(this.#context, key)) {
      return this.#context[key]
    }

    for (const listener of this.#listeners) {
      const response = listener(key)
      if (!Object.is(response, undefined)) {
        return response
      }
    }
  }
}
