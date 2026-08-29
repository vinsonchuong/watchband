import QuickLRU from 'quick-lru'
import {State, Computed, effect as baseEffect} from '../signal/index.js'

export class RenderState extends State {
  map = map
  mapList = mapList
  effect = effect
}

export class ComputedRenderState extends Computed {
  map = map
  mapList = mapList
  effect = effect
}

function map(keyOrTransform) {
  if (typeof keyOrTransform === 'string') {
    const key = keyOrTransform
    return new ComputedRenderState(() => this.get()?.[key])
  }

  const transform = keyOrTransform
  return new ComputedRenderState(() => transform(this.get()))
}

function mapList(cacheKey, transform) {
  const itemSignalCache = new QuickLRU({maxSize: 1000})
  const transformCache = new WeakMap()

  return new ComputedRenderState(() => {
    const list = this.get()
    return list?.map?.((item) => {
      const cacheKeyValue = item[cacheKey]

      let itemSignal = itemSignalCache.get(cacheKeyValue)
      if (itemSignal) {
        // TODO: Check on whether this is safe
        itemSignal.set(item)
      } else {
        itemSignal = new RenderState(item)
        itemSignalCache.set(cacheKeyValue, itemSignal)
      }

      if (transformCache.has(itemSignal)) {
        return transformCache.get(itemSignal)
      }

      const transformedItem = transform(itemSignal)
      transformCache.set(itemSignal, transformedItem)
      return transformedItem
    })
  })
}

function effect(fn) {
  baseEffect(() => {
    fn(this.get())
  })
}
