import path from 'node:path'
import {Logger, compose} from 'passing-notes'
import serveUi from 'passing-notes-ui'
import {html} from '../../lib/web-component/index.js'
import {serialize} from '../../lib/web-component/serialize.js'
import {App} from './ui/app.js'
import {Editor} from './ui/editor.js'

export const logger = new Logger()

export default compose(
  (next) => (request) => {
    if (request.url !== '/') {
      return next(request)
    }

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!doctype html>
        <script type="module" src="/index.js"></script>
        <style>
          body {
            margin: 0;
          }
        </style>
        <body>
          ${serialize(html`<e-app></e-app>`, {
            components: [App, Editor],
            context: {
              'editor:1:text': 'Hello World!',
              'editor:2:text': 'Hello World!',
            },
          })}
        </body>
      `,
    }
  },
  serveUi({
    logger,
    path: path.join(import.meta.dirname, 'ui'),
  }),
  () => () => ({status: 404}),
)
