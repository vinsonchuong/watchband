import path from 'node:path'
import {Logger, compose} from 'passing-notes'
import serveStatic from 'passing-notes-static'
import serveUi from 'passing-notes-ui'
import {serveRxdb} from 'passing-notes-rxdb'
import {Persistence} from 'passing-notes-rxdb/sqlite'
import {html} from '../../lib/web-component/index.js'
import {serialize} from '../../lib/web-component/serialize.js'
import {View} from './ui/view.js'
import {AlbumList} from './ui/album-list.js'
import {AlbumFilterList} from './ui/album-filter-list.js'
import {AlbumCreateButton} from './ui/album-create-button.js'
import {AlbumDeleteButton} from './ui/album-delete-button.js'
import {AlbumEditor} from './ui/album-editor.js'
import {AlbumTracksEditor} from './ui/album-tracks-editor.js'
import {MultilineInput} from './ui/multiline-input.js'
import {schema} from './schema.js'
import {setupAlbumData} from './fixtures/data.js'

const thisDirectory = path.dirname(new URL(import.meta.url).pathname)

export const logger = new Logger()

globalThis.persistence ||= new Persistence(
  path.join(thisDirectory, './data.sql'),
  path.join(thisDirectory, './attachments'),
  schema,
)
const persistence = globalThis.persistence

globalThis.rxdb ||= await globalThis.persistence.createRxDatabase()
const rxdb = globalThis.rxdb

await setupAlbumData(rxdb)

const homeRoutePattern = new URLPattern({pathname: '/'})
const filterRoutePattern = new URLPattern({pathname: '/filter'})
const albumRoutePattern = new URLPattern({
  pathname:
    '/:id([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})',
})

export default compose(
  serveRxdb({persistence, path: '/data'}),
  serveStatic(path.join(thisDirectory, 'attachments'), '/attachments'),
  (next) => async (request) => {
    const url = new URL(request.url, 'https://localhost')

    const homeRouteMatch = homeRoutePattern.exec({pathname: url.pathname})
    const filterRouteMatch = filterRoutePattern.exec({pathname: url.pathname})
    const albumRouteMatch = albumRoutePattern.exec({pathname: url.pathname})

    if (!homeRouteMatch && !filterRouteMatch && !albumRouteMatch) {
      return next(request)
    }

    const albums = (
      await rxdb.albums
        .find({
          sort: [{name: 'asc'}],
        })
        .exec()
    ).map((doc) => {
      const attachment = doc.getAttachment('cover')
      const cover = attachment ? `/attachments/albums/${doc.id}/cover` : null
      return {
        ...doc.toJSON(),
        cover,
      }
    })

    const context = {albums}

    if (homeRouteMatch) {
      context.mode = 'listing-albums'
    } else if (filterRouteMatch) {
      context.mode = 'filtering-albums'
      const queryParameters = new URLSearchParams(url)
      const idsQueryParameter = queryParameters.get('ids')
      const ids = idsQueryParameter ? idsQueryParameter.split(' ') : []
      const idLookup = new Set(ids)
      context.albums = context.albums.filter((a) => idLookup.has(a.id))
    } else if (albumRouteMatch) {
      context.mode = 'editing-album'
      const id = albumRouteMatch.pathname.groups.id
      const album = albums.find((a) => a.id === id)
      context['album.current'] = album
    }

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!doctype html>
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Raleway:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">
        <script type="module" src="/index.js"></script>
        <script async src="https://kit.fontawesome.com/c9e91f5df4.js" crossorigin="anonymous"></script>
        <style>
          *, *::before, *::after {
            box-sizing: border-box;
          }
          body, h1, h2, h3, h4, p, figure, blockquote, dl, dd {
            margin-block: 0;
          }
          ul[role='list'], ol[role='list'] {
            list-style: none;
          }
          body {
            margin: 0;
            font-family: "Raleway", sans-serif;
          }

          @view-transition {
            navigation: auto;
          }

          html:active-view-transition-type(home_album),
          html:active-view-transition-type(album_home),
          html:active-view-transition-type(filter_album),
          html:active-view-transition-type(album_filter) {
            ::part(cover) {
              view-transition-name: attr(data-id type(<custom-ident>));
            }
          }

          html:active-view-transition-type(home_filter),
          html:active-view-transition-type(filter_home) {
            :root {
              view-transition-name: none;
            }
            ::part(page) {
              view-transition-name: page;
            }
          }

          html:active-view-transition-type(home_filter) {
            &::view-transition-old(page) {
              animation-name: slide-down-exit;
              animation-duration: 200ms;
            }
            &::view-transition-new(page) {
              animation-name: slide-right-enter;
              animation-duration: 200ms;
              animation-delay: 200ms;
            }
          }

          html:active-view-transition-type(filter_home) {
            &::view-transition-old(page) {
              animation-name: slide-right-exit;
              animation-duration: 200ms;
            }
            &::view-transition-new(page) {
              animation-name: slide-down-enter;
              animation-duration: 200ms;
              animation-delay: 200ms;
            }
          }

          @keyframes slide-down-enter {
            from {
              opacity: 0;
              translate: 0 -400px;
            }
            to {
              opacity: 1;
              translate: 0 0;
            }
          }

          @keyframes slide-right-enter {
            from {
              opacity: 0;
              translate: -400px 0;
            }
            to {
              opacity: 1;
              translate: 0 0;
            }
          }

          @keyframes slide-down-exit {
            from {
              opacity: 1;
              translate: 0 0;
            }
            to {
              opacity: 0;
              translate: 0 400px;
            }
          }

          @keyframes slide-right-exit {
            from {
              opacity: 1;
              translate: 0 0;
            }
            to {
              opacity: 0;
              translate: 400px 0;
            }
          }
        </style>
        <body>
          ${serialize(html`<crud-view></crud-view>`, {
            components: [
              View,
              AlbumList,
              AlbumFilterList,
              AlbumCreateButton,
              AlbumDeleteButton,
              AlbumEditor,
              AlbumTracksEditor,
              MultilineInput,
            ],
            context,
          })}
        </body>
      `,
    }
  },
  serveUi({
    logger,
    path: path.join(import.meta.dirname, 'ui'),
  }),
  () => () => ({status: 404}),
)
