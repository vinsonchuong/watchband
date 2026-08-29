import {Component, html, css} from 'watchband/web-component'

export class App extends Component {
  static tagName = 'e-app'
  static styles = css`
    :host {
      display: block;
    }

    main {
      box-sizing: border-box;
      display: grid;
      width: 100vw;
      height: 100vh;
      padding: 128px;
    }
  `
  template = html`
    <main>
      <e-editor
        editor-state-id="1"
        on:editor:select=${(_event) => {}}
        on:editor:edit=${(_event) => {}}
      ></e-editor>

      <e-editor
        editor-state-id="2"
        on:editor:select=${(_event) => {}}
        on:editor:edit=${(_event) => {}}
      ></e-editor>
    </main>
  `
}
