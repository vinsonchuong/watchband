import {map} from 'rxjs'
import {Component, html, css} from 'watchband/web-component'

export class AlbumEditor extends Component {
  static tagName = 'crud-album-editor'
  static styles = css`
    article {
      display: grid;
      box-sizing: border-box;
      height: 100%;
      grid-template:
        'header header' 96px
        'album  tracks' minmax(0, 1fr)
        / min(50%, 628px) 1fr;

      & > nav {
        grid-area: header;
        padding: 0 64px;
        line-height: 96px;

        a {
          color: #fff;
          text-decoration: none;
          font-size: 40px;

          &::before {
            font: var(--fa-font-solid);
            content: '\\f104';
          }
        }
      }

      .album {
        grid-area: album;
        display: flex;
        flex-direction: column;
        padding: 0 64px;

        nav {
          flex: 1;
          display: flex;
          padding: 24px 0;
          align-items: end;
          opacity: 0;
          transition: opacity 250ms ease-in-out;

          &:hover {
            opacity: 1;
          }
        }
      }

      .tracks {
        grid-area: tracks;
        padding: 0 64px;
        overflow: auto;
      }

      label {
        display: block;
        position: relative;
        margin-bottom: 40px;
        max-width: 500px;
        aspect-ratio: 1;
        background: rgba(255, 255, 255, 0.8);
        cursor: pointer;

        img {
          display: block;
          margin: 0 auto;
          width: 100%;

          &:not([src]) {
            opacity: 0;
          }
        }

        input {
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          opacity: 0;
          cursor: pointer;

          &::file-selector-button {
            width: 100%;
            height: 100%;
          }
        }
      }

      input {
        display: block;
        border: none;
        width: 100%;
        background: inherit;
        color: #fff;
        font-family: inherit;

        &.name {
          font-size: 32px;
          font-weight: 600;
        }

        &.artist {
          margin-top: 8px;
          font-size: 24px;
        }
      }
    }
  `
  previousRoute = this.context('previousRoute')
  currentAlbum = this.context('album.current')
  nameInputChanges = this.observable()
  nameChanges = this.event(
    'album.current.update',
    this.nameInputChanges.pipe(
      map((event) => ({
        name: event.target.value,
      })),
    ),
  )
  artistInputChanges = this.observable()
  artistChanges = this.event(
    'album.current.update',
    this.artistInputChanges.pipe(
      map((event) => ({
        artist: event.target.value,
      })),
    ),
  )
  coverInputChanges = this.observable()
  coverChanges = this.event(
    'album.current.cover',
    this.coverInputChanges.pipe(
      map((event) => ({
        data: event.target.files[0],
      })),
    ),
  )
  template = html`
    <article>
      <nav>
        <a
          href=${this.previousRoute.map((previousRoute) => {
            const currentAlbum = this.currentAlbum.get()

            if (previousRoute?.id === 'home' && currentAlbum) {
              return `/#album-${currentAlbum.id}`
            }

            if (previousRoute) {
              return previousRoute.url.href
            }

            if (currentAlbum) {
              return `/#album-${currentAlbum.id}`
            }

            return '/'
          })}
          aria-label="Home"
        ></a>
      </nav>
      <div class="album">
        <label
          part="cover"
          data-id=${this.currentAlbum.map('id')}
          aria-label="Upload Album Cover"
        >
          <img src=${this.currentAlbum.map('cover')} />
          <input type="file" on:change=${this.coverInputChanges} />
        </label>

        <input
          class="name"
          placeholder="Name"
          value=${this.currentAlbum.map('name')}
          on:input=${this.nameInputChanges}
        />
        <input
          class="artist"
          placeholder="Artist"
          value=${this.currentAlbum.map('artist')}
          on:input=${this.artistInputChanges}
        />

        <nav>
          <crud-album-delete-button></crud-album-delete-button>
        </nav>
      </div>
      <div class="tracks">
        <crud-album-tracks-editor></crud-album-tracks-editor>
      </div>
    </article>
  `
}
