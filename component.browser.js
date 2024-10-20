import {registerComponent as baseRegisterComponent} from './lib/web-component/index.js'

export {render} from './lib/web-component/index.js'
export * from './lib/web-component/templates.js'
export * from './lib/signal/index.js'
export * from './lib/observable/index.js'

export function registerComponent(Component) {
  return baseRegisterComponent(window, Component)
}
