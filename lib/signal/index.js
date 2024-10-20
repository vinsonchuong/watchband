import {Signal} from 'signal-polyfill'
import {batch} from './batching.js'

export function isSignal(object) {
  return object instanceof Signal.State || object instanceof Signal.Computed
}

export class State extends Signal.State {
  set(value) {
    batch(() => {
      super.set(value)
    })
  }
}

export const Computed = Signal.Computed

export {effect} from './batching.js'

export function fromObservable(observable, initialValue) {
  const state = new State(initialValue)
  observable.subscribe((value) => {
    state.set(value)
  })
  return state
}
