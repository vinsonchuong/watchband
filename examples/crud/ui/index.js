import {createRxDatabase, addRxPlugin} from 'rxdb'
import {RxDBAttachmentsPlugin} from 'rxdb/plugins/attachments'
import {replicateCollection} from 'passing-notes-rxdb/client'
import {schema} from '../schema.js'
import {Navigator} from '../../lib/navigator.js'
import {getRxStorageOPFS} from '../opfs.js'
import {View} from './view.js'
import {AlbumList} from './album-list.js'
import {AlbumFilterList} from './album-filter-list.js'
import {AlbumCreateButton} from './album-create-button.js'
import {AlbumDeleteButton} from './album-delete-button.js'
import {AlbumEditor} from './album-editor.js'
import {AlbumTracksEditor} from './album-tracks-editor.js'
import {MultilineInput} from './multiline-input.js'
import {App} from './app.js'
import {WebMcp} from './mcp.js'
import {fromObservable} from 'watchband/signal'
import {
  registerComponent,
  captureContext,
  Provider,
} from 'watchband/web-component'
import {makeRender} from 'watchband/html'

const {capture} = makeRender(globalThis)
capture()
captureContext(globalThis)

addRxPlugin(RxDBAttachmentsPlugin)

const db = await createRxDatabase({
  name: 'ui',
  storage: getRxStorageOPFS(),
  reactivity: {
    observableIdentityMap: new WeakMap(),
    fromObservable(observable, initialValue) {
      if (this.observableIdentityMap.has(observable)) {
        return this.observableIdentityMap.get(observable)
      }

      const signal = fromObservable(observable, initialValue)
      this.observableIdentityMap.set(observable, signal)
      return signal
    },
  },
  waitForLeadership: false,
  multiInstance: true,
})

await db.addCollections(schema)

const _replicationState = replicateCollection({
  collection: db.albums,
  replicationIdentifier: 'albums',
  url: `${document.location.origin}/data`,
  EventSource: globalThis.EventSource,
  waitForLeadership: false,
})

const provider = new Provider(globalThis)

const navigator = new Navigator(globalThis, provider, [
  {id: 'home', path: '/'},
  {id: 'filter', path: '/filter'},
  {
    id: 'album',
    path: '/:id([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})',
  },
])

const app = new App({provider, window: globalThis, navigator, db})

if (globalThis.navigator.modelContext) {
  const webmcp = new WebMcp({provider, window: globalThis, app, db, navigator})
  webmcp.register()
}

registerComponent(globalThis, View)
registerComponent(globalThis, AlbumList)
registerComponent(globalThis, AlbumFilterList)
registerComponent(globalThis, AlbumCreateButton)
registerComponent(globalThis, AlbumDeleteButton)
registerComponent(globalThis, AlbumEditor)
registerComponent(globalThis, AlbumTracksEditor)
registerComponent(globalThis, MultilineInput)
