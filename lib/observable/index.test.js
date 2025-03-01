import test from 'ava'
import {State} from '../signal/index.js'
import {TestObserver} from './test-observer.js'
import {fromSignal} from './index.js'

test('converting a signal to an observable', (t) => {
  const signal = new State(0)
  const observable = fromSignal(signal)
  const observer = new TestObserver()

  observable.subscribe(observer)

  t.is(observer.events.length, 1)
  t.is(observer.events[0], 0)

  signal.set(1)

  t.is(observer.events.length, 2)
  t.is(observer.events[1], 1)

  signal.set(1)

  t.is(observer.events.length, 2)

  signal.set(2)

  t.is(observer.events.length, 3)
  t.is(observer.events[2], 2)
})
