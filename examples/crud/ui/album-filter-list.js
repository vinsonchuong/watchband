import {Component, html, css} from 'watchband/web-component'

export class AlbumFilterList extends Component {
  static tagName = 'crud-album-filter-list'
  static styles = css`
    div {
      display: grid;
      box-sizing: border-box;
      width: 100vw;
      height: 100%;
      grid-template: 96px 1fr / 1fr;
    }

    nav {
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

    ul {
      display: grid;
      box-sizing: border-box;
      margin: 0;
      padding: 32px 128px 128px;
      overflow: auto;
      grid-template-columns: repeat(3, 1fr);
      place-content: start;
      gap: 40px;
      list-style: none;
    }

    li {
      aspect-ratio: 1;

      a {
        display: block;
        position: relative;
        aspect-ratio: 1;
        background: rgba(255, 255, 255, 0.8);
        color: #000;
        text-decoration: none;

        &:has(img:not([src]))::before {
          display: grid;
          position: absolute;
          box-sizing: border-box;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          padding: 16px;
          place-content: center;
          content: attr(data-name);
          font-size: 2vw;
        }

        img {
          display: block;
          width: 100%;
          height: 100%;
          &:not([src]) {
            opacity: 0;
          }
        }
      }
    }
  `
  albums = this.context('albums')
  template = html`
    <div>
      <nav>
        <a aria-label="Home" href="/"></a>
      </nav>
      <ul>
        ${this.albums.mapList(
          'id',
          (album) => html`
            <li>
              <a
                part="cover"
                data-id=${album.map('id')}
                id=${album.map('id').map((id) => `album-${id}`)}
                href=${album.map('id').map((id) => id && `/${id}`)}
                data-name=${album.map('name')}
              >
                <img src=${album.map('cover')} />
              </a>
            </li>
          `,
        )}
      </ul>
    </div>
  `
}
