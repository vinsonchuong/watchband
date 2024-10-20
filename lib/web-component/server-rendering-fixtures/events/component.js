import {Subject, merge, map, scan} from 'rxjs'
import {html, css, fromObservable} from '../../../../component.browser.js'

export default class Component {
  static tagName = 'wc-component'
  static styles = css`
    p {
      color: red;
    }
  `
  increments = new Subject()
  decrements = new Subject()
  count = fromObservable(
    merge(
      this.increments.pipe(map(() => 1)),
      this.decrements.pipe(map(() => -1)),
    ).pipe(scan((runningCount, operand) => runningCount + operand, 0)),
    0,
  )
  template = html`
    <div>
      <p>${this.count}</p>
      <button on:click=${this.increments}>Increment</button>
      <button on:click=${this.decrements}>Decrement</button>
    </div>
  `
}
