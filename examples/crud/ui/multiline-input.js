import {map, scan, tap} from 'rxjs'
import {Component, html, css} from 'watchband/web-component'

export class MultilineInput extends Component {
  static tagName = 'crud-multiline-input'
  static styles = css`
    div[contenteditable] {
      border: 1px solid #aaa;
    }
  `
  initialValue = this.attribute('initial-value')
  inputs = this.observable().pipe(
    tap((event) => {
      event.stopPropagation()
    }),
  )
  dirty = this.signal(this.inputs.pipe(scan(() => true, false)))
  emittedInputs = this.event(
    'input',
    this.inputs.pipe(map((event) => ({value: event.target.textContent}))),
  )
  template = html`
    <div contenteditable="plaintext-only" on:input=${this.inputs}>
      ${this.signal(() =>
        this.dirty.get() ? undefined : this.initialValue.get(),
      )}
    </div>
  `
}
