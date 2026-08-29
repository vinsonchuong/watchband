import {Navigator} from '../../lib/navigator.js'
import {App} from './app.js'
import {
  registerComponent,
  captureContext,
  Provider,
} from 'watchband/web-component'
import {makeRender} from 'watchband/html'

const {capture} = makeRender(globalThis)
capture()
captureContext(globalThis)

const provider = new Provider(globalThis)

const _navigator = new Navigator(globalThis, provider, [
  {id: 'home', path: '/'},
  {id: 'one', path: '/one'},
  {id: 'two', path: '/two'},
  {id: 'three', path: '/three'},
])

registerComponent(globalThis, App)
