import path from 'node:path'
import {fileURLToPath} from 'node:url'
import {compose, Logger} from 'passing-notes'
import serveUi from 'passing-notes-ui'
import {render} from '../../server-rendering.js'
import Component from './component.js'

const fixtureDirectory = path.dirname(fileURLToPath(import.meta.url))

export const logger = new Logger()

export default compose(
  (next) => (request) => {
    if (request.url !== '/') {
      return next(request)
    }

    const html = render(Component, {
      html: `
        <!doctype html>
        <script type="module" src="/index.js"></script>
      `,
    })

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: html,
    }
  },
  serveUi({
    logger,
    path: fixtureDirectory,
  }),
  () => () => ({status: 404}),
)
