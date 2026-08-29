import {map} from 'rxjs'
import {Component, html, css} from 'watchband/web-component'

export class AlbumDeleteButton extends Component {
  static tagName = 'crud-album-delete-button'
  static styles = css`
    button {
      border: 0;
      padding: 0;
      background: none;
      color: #fff;
      font-size: 40px;
      cursor: pointer;

      &::before {
        content: '\\f2ed';
        font: var(--fa-font-solid);
      }
    }
  `
  clicks = this.event()
  creates = this.event('album.current.delete', this.clicks.pipe(map(() => {})))
  template = html`<button on:click=${this.clicks} aria-label="Delete"></button>`
}
