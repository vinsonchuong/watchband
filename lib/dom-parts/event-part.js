import {fromEvent} from 'rxjs'

export class EventPart {
  observable

  constructor(element, type) {
    this.element = element
    this.type = type

    this.listen()
  }

  listen() {
    this.observable = fromEvent(this.element, this.type)
  }

  subscribe(listener) {
    this.observable.subscribe(listener)
  }
}
