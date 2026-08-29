export class UniqueQueue {
  #set = new Set()
  #queue = []

  add(item) {
    if (this.#set.has(item)) {
      return
    }

    this.#set.add(item)
    this.#queue.push(item)
  }

  has(item) {
    return this.#set.has(item)
  }

  take() {
    const item = this.#queue.shift()
    this.#set.delete(item)
    return item
  }

  delete(item) {
    if (!this.#set.has(item)) {
      return
    }

    this.#set.delete(item)
    this.#queue = this.#queue.filter((i) => i !== item)
  }

  get size() {
    return this.#queue.length
  }

  isEmpty() {
    return this.#queue.length === 0
  }
}
