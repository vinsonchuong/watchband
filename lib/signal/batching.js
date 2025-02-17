import {Signal} from 'signal-polyfill'
import {UniqueQueue} from './unique-queue.js'

const dirtyEffects = new UniqueQueue()
let currentBatchDepth = 0
let processing = false

export function batch(fn) {
  currentBatchDepth++
  fn()
  currentBatchDepth--

  if (currentBatchDepth !== 0 || processing) {
    return
  }

  processing = true

  while (!dirtyEffects.isEmpty()) {
    const {signal, watch} = dirtyEffects.take()
    watch()
    signal.get()
  }

  processing = false
}

export function effect(fn) {
  const signal = new Signal.Computed(fn)
  const watcher = new Signal.subtle.Watcher(() => {
    dirtyEffects.add(entry)

    queueMicrotask(() => {
      if (dirtyEffects.has(entry)) {
        console.warn(`Unflushed effect: ${fn.toString()}`)
      }
    })
  })

  const entry = {
    signal,
    watch() {
      watcher.watch(signal)
    },
  }
  entry.watch()
  signal.get()

  return () => {
    watcher.unwatch(signal)
    dirtyEffects.delete(entry)
  }
}
