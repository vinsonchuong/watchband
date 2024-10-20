import {Subject} from 'rxjs'

export class TestObserver extends Subject {
  events = []

  constructor() {
    super()
    this.subscribe((event) => {
      this.events.push(event)
    })
  }
}
