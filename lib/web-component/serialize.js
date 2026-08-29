import {serialize as baseSerialize} from '../html/serialize.js'
import {State} from '../signal/index.js'
import {registerComponent} from './web-component.js'
import {Provider} from './provider.js'

export function serialize(template, {components = [], context = {}} = {}) {
  return baseSerialize(template, {
    beforeRender(window) {
      const provider = new Provider(window)
      provider.listen((key) => new State(context[key]))

      for (const Component of components) {
        registerComponent(window, Component)
      }
    },
  })
}
