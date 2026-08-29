import path from 'node:path'
import {Logger, compose} from 'passing-notes'
import serveUi from 'passing-notes-ui'
import {html} from '../../lib/web-component/index.js'
import {serialize} from '../../lib/web-component/serialize.js'
import {App} from './ui/app.js'

export const logger = new Logger()

const routes = {
  '/': {id: 'root'},
  '/one': {id: 'one'},
  '/two': {id: 'two'},
  '/three': {id: 'three'},
}

export default compose(
  (next) => (request) => {
    if (!Object.hasOwn(routes, request.url)) {
      return next(request)
    }

    const route = routes[request.url]

    return {
      status: 200,
      headers: {
        'Content-Type': 'text/html',
      },
      body: `
        <!doctype html>
        <script type="module" src="/index.js"></script>
        <body>
          ${serialize(html`<navigation-app></navigation-app>`, {
            components: [App],
            context: {
              route: route.id,
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
