import {App} from './app.js'
import {Editor} from './editor.js'
import {EditorState} from './editor-state.js'
import {makeRender} from 'watchband/html'
import {
  registerComponent,
  captureContext,
  Provider,
} from 'watchband/web-component'

const {capture} = makeRender(globalThis)
capture()
captureContext(globalThis)

const provider = new Provider(globalThis)

const initialState = EditorState.initialStateFromText('Hello World!')

const editor1State = new EditorState({
  provider,
  window: globalThis,
  editorStateId: '1',
  initialState,
})

const editor2State = new EditorState({
  provider,
  window: globalThis,
  editorStateId: '2',
  initialState,
})

EditorState.sync(editor1State, editor2State)

registerComponent(globalThis, App)
registerComponent(globalThis, Editor)
