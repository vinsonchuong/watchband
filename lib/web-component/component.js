import {Subject} from 'rxjs'
import {State, Computed, effect} from '../signal/index.js'

export class Component {
  static tagName = 'wc-component'
  static attributes = []
  connected = new State(false)
  events = new Subject()

  ask(key) {
    let upstreamSignal = null
    const ready = new State(false)
    const linkedSignal = new Computed(() =>
      ready.get() ? upstreamSignal.get() : null,
    )

    const cleanup = effect(() => {
      if (this.connected.get()) {
        cleanup()
        this.events.next({
          type: 'context-request',
          detail: {
            key,
            callback(signal) {
              upstreamSignal = signal
              ready.set(true)
            },
          },
        })
      }
    })

    return linkedSignal
  }
}
