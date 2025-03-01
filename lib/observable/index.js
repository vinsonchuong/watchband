import {BehaviorSubject} from 'rxjs'
import {effect} from '../signal/index.js'

export function isObserver(object) {
  return object?.next || typeof object === 'function'
}

export {isObservable} from 'rxjs'

export function fromSignal(signal) {
  const subject = new BehaviorSubject(signal.get())

  effect(() => {
    const value = signal.get()
    if (value !== subject.value) {
      subject.next(value)
    }
  })

  return subject
}
