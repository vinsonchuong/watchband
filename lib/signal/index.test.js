import test from 'ava'
import {State, Computed, effect} from './index.js'

test('observing signals synchronously', (t) => {
  const state = new State(0)
  const computed = new Computed(() => {
    return state.get() * 2
  })

  const stateReads = observeReads(state)
  const computedReads = observeReads(computed)

  t.deepEqual(stateReads, [0])
  t.deepEqual(computedReads, [0])

  state.set(1)
  t.deepEqual(stateReads, [0, 1])
  t.deepEqual(computedReads, [0, 2])

  state.set(2)
  t.deepEqual(stateReads, [0, 1, 2])
  t.deepEqual(computedReads, [0, 2, 4])
})

test('writing to signals within an effect and still observing synchronously', (t) => {
  const upstreamState = new State(0)
  const downstreamState = new State(0)

  const upstreamReads = observeReads(upstreamState)
  const downstreamReads = observeReads(downstreamState)

  effect(() => {
    downstreamState.set(upstreamState.get() * 2)
  })

  t.deepEqual(upstreamReads, [0])
  t.deepEqual(downstreamReads, [0])

  upstreamState.set(1)
  t.deepEqual(upstreamReads, [0, 1])
  t.deepEqual(downstreamReads, [0, 2])

  upstreamState.set(2)
  t.deepEqual(upstreamReads, [0, 1, 2])
  t.deepEqual(downstreamReads, [0, 2, 4])
})

function observeReads(signal) {
  const reads = []
  effect(() => {
    reads.push(signal.get())
  })
  return reads
}
