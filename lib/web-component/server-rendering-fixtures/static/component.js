import {html, css} from '../../../../component.browser.js'

export default class Component {
  static tagName = 'wc-component'
  static styles = css`
    p {
      color: red;
    }
  `
  template = html`<p>Hello World!</p>`
}
