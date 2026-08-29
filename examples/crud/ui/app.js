import {isRxDocument} from 'rxdb'
import {Actor} from '../../lib/actor.js'
import {State, Computed} from 'watchband/signal'

export class App extends Actor {
  #albumCache = new Map()
  #albumCoverCache = new Map()
  route = this.context('route')
  mode = this.context('mode', () => {
    const {id} = this.route.get()
    if (id === 'home') {
      return 'listing-albums'
    }

    if (id === 'filter') {
      return 'filtering-albums'
    }

    return 'editing-album'
  })
  albumsSignals = this.context('albums', () => {
    const albums = this.db.albums.find({sort: [{name: 'asc'}]}).$$

    if (this.mode.get() === 'filtering-albums') {
      const queryParameters = new URLSearchParams(
        this.window.document.location.search,
      )
      const idsQueryParameter = queryParameters.get('ids')
      const ids = idsQueryParameter ? idsQueryParameter.split(' ') : []
      const idLookup = new Set(ids)

      return albums
        .get()
        ?.filter((doc) => idLookup.has(doc.id))
        ?.filter((doc) => !doc.deleted) // Odd workaround
        ?.map((doc) => this.#getAlbum(doc).get())
    }

    return albums
      .get()
      ?.filter((doc) => !doc.deleted) // Odd workaround
      ?.map((doc) => this.#getAlbum(doc).get())
  })
  currentAlbum = this.context('album.current', () => {
    if (this.mode.get() !== 'editing-album') {
      return
    }

    const {
      data: {id},
    } = this.route.get()
    return this.#getAlbum(id).get()
  })
  updateCurrentAlbum = this.event('album.current.update', async (patch) => {
    const {id} = this.currentAlbum.get()
    const doc = await this.db.albums.findOne(id).exec()
    await doc.incrementalPatch(patch)
  })
  updateCurrentAlbumCover = this.event(
    'album.current.cover',
    async ({data}) => {
      const {id} = this.currentAlbum.get()
      const doc = await this.db.albums.findOne(id).exec()
      await doc.putAttachment({id: 'cover', data, type: data.type})
    },
  )
  deleteCurrentAlbum = this.event('album.current.delete', async () => {
    const {id} = this.currentAlbum.get()
    const doc = await this.db.albums.findOne(id).exec()
    await doc.remove()

    this.navigator.navigate('/')
  })
  createAlbum = this.event('album.create', async () => {
    const doc = await this.db.albums.insert({
      id: crypto.randomUUID(),
      updatedAt: Date.now(),
      name: '',
      artist: '',
      tracks: [],
    })

    this.navigator.navigate(`/${doc.id}`)
  })

  #getAlbum(idOrDoc) {
    let id
    let doc
    let signal

    if (isRxDocument(idOrDoc)) {
      doc = idOrDoc
      id = doc.id
    } else {
      id = idOrDoc
    }

    if (this.#albumCache.has(id)) {
      signal = this.#albumCache.get(id)
    } else if (doc) {
      signal = doc.$$
      this.#albumCache.set(id, signal)
    } else {
      signal = this.db.albums.findOne(id).$$
      this.#albumCache.set(id, signal)
    }

    return new Computed(() => {
      const currentDoc = signal.get()
      if (currentDoc) {
        const cover = this.#getAlbumCover(currentDoc)
        return {...currentDoc.toJSON(), cover: cover.get()}
      }
    })
  }

  // TODO: De-allocate object URLs
  #getAlbumCover(doc) {
    const attachment = doc.getAttachment('cover')

    if (this.#albumCoverCache.has(doc.id)) {
      const {digest, signal} = this.#albumCoverCache.get(doc.id)

      if (attachment && digest !== attachment.digest) {
        attachment.getData().then((blob) => {
          signal.set(URL.createObjectURL(blob))
        })
        this.#albumCoverCache.set(doc.id, {digest: attachment.digest, signal})
      } else if (!attachment && digest) {
        this.#albumCoverCache.set(doc.id, {digest: null, signal})
        signal.set(undefined)
      }

      return signal
    }

    const signal = new State()

    if (attachment) {
      attachment.getData().then((blob) => {
        signal.set(URL.createObjectURL(blob))
      })
      this.#albumCoverCache.set(doc.id, {digest: attachment.digest, signal})
    } else {
      this.#albumCoverCache.set(doc.id, {digest: null, signal})
    }

    return signal
  }
}
