import {Subject} from 'rxjs'
import {State, Computed, effect, isSignal} from '../signal/index.js'

export class Component {
  static tagName = 'wc-component'
  static attributes = []
  connected = new State(false)
  events = new Subject()

  event(name, observable) {
    const events = observable ?? new Subject()

    if (name) {
      events.subscribe((event) => {
        this.events.next({
          type: name,
          detail: event,
        })
      })
    }

    return events
  }

  ask(key) {
    let upstreamSignal = null
    const ready = new State(false)
    const linkedSignal = new Computed(() =>
      ready.get() ? upstreamSignal.get() : null,
    )

    const cleanup = effect(() => {
      const resolvedKey = isSignal(key) ? key.get() : key
      if (Object.is(undefined, resolvedKey) || Object.is(null, resolvedKey)) {
        return
      }

      if (this.connected.get()) {
        cleanup()
        this.events.next({
          type: 'context-request',
          detail: {
            key: resolvedKey,
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
