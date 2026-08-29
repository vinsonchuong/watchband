import {map, tap, filter, mergeMap, of} from 'rxjs'
import uniqolor from 'uniqolor'
import {Component, html, css} from 'watchband/web-component'

export class Editor extends Component {
  static tagName = 'e-editor'
  static styles = css`
    :host {
      display: block;
      position: relative;
    }

    [contenteditable] {
      box-sizing: border-box;
      border: 1px solid #ccc;
      padding: 16px;
      white-space: pre;
    }

    .caret {
      position: absolute;
      width: 2px;
      height: 1lh;
    }
  `
  editorStateId = this.attribute('editor-state-id')
  externalUpdates = this.context(
    this.editorStateId.map((id) => `editor:${id}:external-updates`),
  ).effect((updates) => {
    if (updates) {
      updates.subscribe((update) => {
        const {document, editable} = this.#getDom()

        if (!editable.hasChildNodes()) {
          editable.append(document.createTextNode(''))
        }

        const textNode = editable.childNodes[0]

        const op = update[0]

        if (op === 'insert') {
          const [, offset, text] = update
          textNode.insertData(offset, text)
        } else if (op === 'delete') {
          const [, offset, count] = update
          textNode.deleteData(offset, count)
        }
      })
    }
  })
  externalSelections = this.context(
    this.editorStateId.map((id) => `editor:${id}:external-selections`),
  )
  #textInitialized = false
  currentValue = this.context(
    this.editorStateId.map((id) => `editor:${id}:text`),
  ).effect((text) => {
    if (this.#textInitialized || typeof text !== 'string') {
      return
    }

    this.#textInitialized = true
    const {shadowRoot} = this.element
    const editable = shadowRoot.querySelector('[contenteditable]')
    editable.textContent = text
  })
  inputs = this.observable().pipe(
    tap((event) => {
      event.stopPropagation()
    }),
  )
  selectionchanges = this.documentEvent('selectionchange')
  selects = this.event(
    'editor:select',
    this.selectionchanges.pipe(
      map((_event) => {
        const {shadowRoot, editable} = this.#getDom()

        if (shadowRoot.activeElement !== editable) {
          this.selection.set(null)
          return {
            editorStateId: this.editorStateId.get(),
            selection: null,
          }
        }

        const document = this.element.ownerDocument
        const selection = document.getSelection()
        const [range] = selection.getComposedRanges({
          shadowRoots: [shadowRoot],
        })

        const newLogicalSelection = getAbsoluteTextRange(editable, range)
        this.selection.set(newLogicalSelection)
        return {
          editorStateId: this.editorStateId.get(),
          selection: newLogicalSelection,
        }
      }),
    ),
  )
  selection = this.signal(null)
  edits = this.event(
    'editor:edit',
    this.inputs.pipe(
      filter((event) => {
        const {editable} = this.#getDom()
        return event.target === editable
      }),
      mergeMap((event) => {
        const {start, end} = this.selection.get()

        if (event.inputType === 'insertText') {
          if (start < end) {
            return of(
              ['delete', start, end - start],
              ['insert', start, event.data],
            )
          }

          return of(['insert', start, event.data])
        }

        if (event.inputType === 'insertLineBreak') {
          if (start < end) {
            return of(['delete', start, end - start], ['insert', start, '\n'])
          }

          return of(['insert', start, '\n'])
        }

        if (event.inputType === 'deleteContentBackward') {
          if (start < end) {
            return of(['delete', start, end - start])
          }

          return of(['delete', start - 1, 1])
        }

        return null
      }),
      map((edit) => ({
        editorStateId: this.editorStateId.get(),
        edit,
      })),
    ),
  )
  styles = this.externalSelections.map(
    (items) => css`
      ${
        items
          ?.map(({editorStateId}) => {
            const {color: backgroundColor, isLight} = uniqolor(editorStateId)
            const color = isLight ? '#000' : '#fff'
            return `
            ::highlight(editor-state-${editorStateId}) {
              background-color: ${backgroundColor};
              color: ${color};
            }

            .caret[data-editor-state-id="${editorStateId}"] {
              background: oklch(from ${backgroundColor} calc(1 * 0.5) c h);
            }
          `
          })
          .join('\n') ?? ''
      }
    `,
  )
  template = html`
    <div contenteditable="plaintext-only" on:input=${this.inputs}></div>
    <div>
      ${this.externalSelections.mapList(
        'editorStateId',
        (item) => html`
          <div
            class="caret"
            data-editor-state-id=${item.map('editorStateId')}
            style=${item.map((data) => {
              if (!data.selection) {
                return 'display: none;'
              }

              const {
                selection: {end},
              } = data

              const {window, editable} = this.#getDom()

              const textNode = editable.childNodes[0]

              const range = new window.Range()
              range.setStart(textNode, end)
              range.setEnd(textNode, end)

              const {top: rootTop, left: rootLeft} =
                this.element.getBoundingClientRect()
              const {top, left} = range.getBoundingClientRect()

              return [
                `top: ${top - rootTop}px;`,
                `left: ${left - rootLeft}px;`,
              ].join(' ')
            })}
          ></div>
        `,
      )}
    </div>
  `
  #highlights = new Map()
  #externalHighlights = this.externalSelections.effect((items) => {
    if (!this.element || !items || items.length === 0) {
      return
    }

    const {window, editable} = this.#getDom()
    const textNode = editable.childNodes[0]

    for (const {editorStateId, selection} of items) {
      if (!this.#highlights.has(editorStateId)) {
        const highlight = new window.Highlight()
        window.CSS.highlights.set(`editor-state-${editorStateId}`, highlight)
        this.#highlights.set(editorStateId, highlight)
      }

      const highlight = this.#highlights.get(editorStateId)
      highlight.clear()

      if (selection) {
        const range = new window.Range()
        range.setStart(textNode, selection.start)
        range.setEnd(textNode, selection.end)
        highlight.add(range)
      }
    }
  })

  #getDom() {
    const document = this.element.ownerDocument
    const window = document.defaultView
    const {shadowRoot} = this.element
    const editable = shadowRoot.querySelector('[contenteditable]')
    editable.normalize()

    return {window, document, shadowRoot, editable}
  }
}

function getAbsoluteTextRange(element, range) {
  const startOffset = getAbsoluteTextOffset(
    element,
    range.startContainer,
    range.startOffset,
  )

  const endOffset = getAbsoluteTextOffset(
    element,
    range.endContainer,
    range.endOffset,
  )

  return startOffset < endOffset
    ? {start: startOffset, end: endOffset}
    : {start: startOffset, end: endOffset}
}

function getAbsoluteTextOffset(element, selectedNode, offset) {
  const window = element.ownerDocument.defaultView

  // SelectedNode is a <br>
  if (element === selectedNode) {
    let currentOffset = 0
    let absoluteTextIndex = 0
    for (const node of element.childNodes) {
      if (currentOffset === offset) {
        return absoluteTextIndex
      }

      if (node instanceof window.Text) {
        absoluteTextIndex += node.length
        currentOffset += 1
      } else if (node instanceof window.HTMLBRElement) {
        absoluteTextIndex += 1
        currentOffset += 1
      } else if (!(node instanceof window.Comment)) {
        console.error(element, selectedNode, offset)
        throw new Error('Unexpected element')
      }
    }
  } else {
    let absoluteTextIndex = 0

    for (const currentNode of element.childNodes) {
      if (currentNode instanceof window.Comment) {
        continue
      }

      if (currentNode === selectedNode) {
        return absoluteTextIndex + offset
      }

      absoluteTextIndex += currentNode.length ?? 1
    }
  }

  return null
}
