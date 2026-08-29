import {Component, html, css} from 'watchband/web-component'

export class AlbumList extends Component {
  static tagName = 'crud-album-list'
  static styles = css`
    :host {
      --cover-size: 28vh;
    }

    div {
      display: grid;
      width: 100vw;
      height: 100%;
      overflow: auto;
      scroll-snap-type: x mandatory;
      transform-style: preserve-3d;
      perspective: calc(var(--cover-size) * 6);
      grid-template-rows: 1fr 96px;
    }

    ul {
      display: grid;
      grid-auto-flow: column;
      box-sizing: border-box;
      transform-style: preserve-3d;
      margin: 0;
      padding: calc(50vh - 0.5 * var(--cover-size)) 0
        calc(50vh - 0.5 * var(--cover-size) - 96px);
      list-style: none;

      &::before {
        display: block;
        content: '';
        width: calc(50vw - 0.5 * var(--cover-size));
      }

      &::after {
        display: block;
        content: '';
        width: calc(50vw - 0.5 * var(--cover-size));
      }
    }

    li {
      transform-style: preserve-3d;
      width: var(--cover-size);
      height: var(--cover-size);
      scroll-snap-align: center;
    }

    a {
      display: block;
      width: var(--cover-size);
      height: var(--cover-size);
      position: relative;
      animation: linear rotate-cover both;
      animation-timeline: view(inline);
      transform-style: preserve-3d;
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
        padding: 24px;
        place-content: center;
        content: attr(data-name);
        font-size: 2.5vw;
      }
    }

    img {
      display: block;
      width: var(--cover-size);
      height: var(--cover-size);
      &:not([src]) {
        opacity: 0;
      }
    }

    nav {
      position: sticky;
      width: max-content;
      left: 0;
      padding: 0 64px;
      line-height: 96px;
      opacity: 0;
      transition: opacity 250ms ease-in-out;

      &:hover {
        opacity: 1;
      }

      crud-album-create-button {
        display: inline-block;
        vertical-align: middle;
      }
    }

    @keyframes rotate-cover {
      0% {
        transform: translateX(-100%) rotateY(-45deg);
      }
      35% {
        transform: translateX(0) rotateY(-45deg);
      }
      50% {
        transform: rotateY(0deg) scale(1.5);
      }
      65% {
        transform: translateX(0) rotateY(45deg);
      }
      100% {
        transform: translateX(100%) rotateY(45deg);
      }
    }
  `
  albums = this.context('albums')
  template = html`
    <div>
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

      <nav>
        <crud-album-create-button></crud-album-create-button>
      </nav>
    </div>
  `
}
