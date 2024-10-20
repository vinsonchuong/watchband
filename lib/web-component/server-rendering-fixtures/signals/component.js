import {html, css, State} from '../../../../component.browser.js'

export default class Component {
  static tagName = 'wc-component'
  static styles = css`
    p {
      color: red;
    }
  `
  message = new State('Hello World!')
  template = html`<p>${this.message}</p>`
}
