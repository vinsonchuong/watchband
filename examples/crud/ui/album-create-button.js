import {map} from 'rxjs'
import {Component, html, css} from 'watchband/web-component'

export class AlbumCreateButton extends Component {
  static tagName = 'crud-album-create-button'
  static styles = css`
    button {
      display: block;
      border: 0;
      padding: 0;
      background: none;
      color: #fff;
      font-size: 40px;
      cursor: pointer;

      &::before {
        content: '\\+';
        font: var(--fa-font-solid);
      }
    }
  `
  clicks = this.event()
  creates = this.event('album.create', this.clicks.pipe(map(() => {})))
  template = html`<button on:click=${this.clicks}></button>`
}
