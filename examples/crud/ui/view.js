import {Component, html, css} from 'watchband/web-component'

export class View extends Component {
  static tagName = 'crud-view'
  static styles = css`
    main {
      position: relative;
      display: grid;
      height: 100vh;
      grid-template-rows: minmax(0, 1fr);
      background: url('/color-splash-4k.jpg') center / cover no-repeat fixed;

      &::before {
        position: absolute;
        display: block;
        z-index: 1;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        content: '';
        background: rgba(0, 0, 0, 0.5);
        backdrop-filter: blur(32px);
      }

      & > * {
        z-index: 2;
      }
    }
  `
  mode = this.context('mode')
  template = html`
    <main>
      ${this.mode.map((mode) => {
        if (mode === 'editing-album') {
          return html`<crud-album-editor
            part="page"
            exportparts="cover"
          ></crud-album-editor>`
        }

        if (mode === 'filtering-albums') {
          return html`<crud-album-filter-list
            part="page"
            exportparts="cover"
          ></crud-album-filter-list>`
        }

        return html`<crud-album-list
          part="page"
          exportparts="cover"
        ></crud-album-list>`
      })}
    </main>
  `
}
