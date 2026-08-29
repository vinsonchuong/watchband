import Sortable from 'sortablejs'
import {map, merge} from 'rxjs'
import {Component, html, css} from 'watchband/web-component'

export class AlbumTracksEditor extends Component {
  static tagName = 'crud-album-tracks-editor'
  static styles = css`
    ol {
      margin: 0;
      padding: 0;
      color: #fff;
      counter-reset: tracks;

      li {
        display: flex;
        line-height: 48px;
        font-size: 24px;

        span {
          width: 40px;

          &::before {
            margin-right: 16px;
            counter-increment: tracks;
            content: counters(tracks, '.');
            cursor: grab;
          }
        }

        input {
          flex: 1;
        }

        button {
          display: inline-block;
          border: 0;
          padding: 0;
          background: none;
          color: #fff;
          line-height: 48px;
          font-size: 24px;
          cursor: pointer;
          opacity: 0;

          &::before {
            content: '\\f2ed';
            font: var(--fa-font-solid);
          }
        }

        &:hover {
          button {
            opacity: 1;
          }
        }
      }
    }

    input {
      border: none;
      width: 100%;
      background: inherit;
      color: #fff;
      font-family: inherit;
      font-size: 24px;
    }

    nav {
      button {
        display: inline-block;
        border: 0;
        padding: 0;
        background: none;
        color: #fff;
        line-height: 48px;
        font-size: 24px;
        cursor: pointer;

        &::before {
          content: '\\+';
          font: var(--fa-font-solid);
        }
      }
    }
  `
  currentAlbum = this.context('album.current')
  creates = this.observable()
  inputChanges = this.observable()
  deletes = this.observable()
  template = html`
    <div>
      <ol>
        ${this.currentAlbum.map('tracks').mapList(
          'id',
          (track) => html`
            <li>
              <span class="sort-handle"></span>
              <input
                data-id=${track.map('id')}
                value=${track.map('name')}
                on:input=${this.inputChanges}
                placeholder="New Track"
              />
              <button
                data-id=${track.map('id')}
                on:click=${this.deletes}
              ></button>
            </li>
          `,
        )}
      </ol>

      <nav>
        <button on:click=${this.creates}></button>
      </nav>
    </div>
  `
  sorts = this.observable()
  updates = this.event(
    'album.current.update',
    merge(
      this.creates.pipe(
        map(() => {
          const album = this.currentAlbum.get()
          return {
            tracks: album.tracks.concat({
              id: crypto.randomUUID(),
              name: '',
            }),
          }
        }),
      ),
      this.inputChanges.pipe(
        map((event) => {
          const id = event.target.dataset.id
          const album = this.currentAlbum.get()
          const updatedTracks = album.tracks.map((track) =>
            track.id === id ? {id, name: event.target.value} : track,
          )
          return {tracks: updatedTracks}
        }),
      ),
      this.deletes.pipe(
        map((event) => {
          const id = event.target.dataset.id
          const album = this.currentAlbum.get()
          const updatedTracks = album.tracks.filter((track) => track.id !== id)
          return {tracks: updatedTracks}
        }),
      ),
      this.sorts.pipe(
        map((event) => {
          const album = this.currentAlbum.get()
          const track = album.tracks.at(event.oldIndex)
          const updatedTracks = album.tracks
            .toSpliced(event.oldIndex, 1)
            .toSpliced(event.newIndex, 0, track)
          return {tracks: updatedTracks}
        }),
      ),
    ),
  )

  afterRender() {
    // TODO: A better way to distinguish between browser and SSR
    if (!globalThis.window) {
      return
    }

    Sortable.create(this.element.internals.shadowRoot.querySelector('ol'), {
      animation: 150,
      handle: '.sort-handle',
      onUpdate: (event) => {
        this.sorts.next(event)
      },
    })
  }
}
