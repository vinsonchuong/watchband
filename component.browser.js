import {registerComponent as baseRegisterComponent} from './lib/web-component/index.js'

export {render, Component} from './lib/web-component/index.js'
export * from './lib/html/template/index.js'
export * from './lib/signal/index.js'
export * from './lib/observable/index.js'

export function registerComponent(Component) {
  return baseRegisterComponent(globalThis, Component)
}
