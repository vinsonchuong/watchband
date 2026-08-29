import * as Y from 'yjs'
import {Subject} from 'rxjs'
import {Actor} from '../../lib/actor.js'

export class EditorState extends Actor {
  #doc
  #localUpdate = false
  externalUpdates = new Subject()
  externalUpdatesContext = this.context(
    `editor:${this.editorStateId}:external-updates`,
    this.externalUpdates,
  )
  text = this.context(`editor:${this.editorStateId}:text`, '')
  #selection = new Subject()
  #externalSelections = this.context(
    `editor:${this.editorStateId}:external-selections`,
    [],
  )

  constructor(parameters) {
    super(parameters)
    this.#doc = new Y.Doc()
    const text = this.#doc.getText('text')

    Y.applyUpdate(this.#doc, this.initialState)
    this.text.set(text.toString())

    text.observe((event) => {
      this.text.set(text.toString())

      if (this.#localUpdate) {
        return
      }

      let index = 0

      for (const action of event.delta) {
        if (action.retain) {
          index += action.retain
        } else if (action.delete) {
          this.externalUpdates.next(['delete', index, action.delete])
          index += action.delete
        } else if (action.insert) {
          this.externalUpdates.next(['insert', index, action.insert])
        }
      }
    })
  }

  edit = this.event(
    'editor:edit',
    ({editorStateId, edit: [operator, ...parameters]}) => {
      if (editorStateId !== this.editorStateId) {
        return
      }

      const text = this.#doc.getText('text')

      this.#localUpdate = true
      text[operator](...parameters)
      this.#localUpdate = false
    },
  )
  select = this.event('editor:select', ({editorStateId, selection}) => {
    if (editorStateId !== this.editorStateId) {
      return
    }

    this.#selection.next(selection)
  })

  #setExternalSelection(editorStateId, selection) {
    const currentSelections = this.#externalSelections.get()
    let hasId = false

    const newSelections = currentSelections.map((currentSelection) => {
      if (currentSelection.editorStateId === editorStateId) {
        hasId = true
        return {editorStateId, selection}
      }

      return currentSelection
    })

    if (!hasId) {
      newSelections.push({editorStateId, selection})
      newSelections.sort((s1, s2) =>
        s1.editorStateId < s2.editorStateId
          ? -1
          : s1.editorStateId > s2.editorStateId
            ? 1
            : 0,
      )
    }

    this.#externalSelections.set(newSelections)
  }

  static initialStateFromText(text) {
    const doc = new Y.Doc()
    doc.getText('text').insert(0, text)
    return Y.encodeStateAsUpdate(doc)
  }

  static sync(editorState1, editorState2) {
    editorState1.#doc.on('update', (update) => {
      Y.applyUpdate(editorState2.#doc, update)
    })
    editorState1.#selection.subscribe((selection) => {
      editorState2.#setExternalSelection(editorState1.editorStateId, selection)
    })

    editorState2.#doc.on('update', (update) => {
      Y.applyUpdate(editorState1.#doc, update)
    })
    editorState2.#selection.subscribe((selection) => {
      editorState1.#setExternalSelection(editorState2.editorStateId, selection)
    })
  }
}
