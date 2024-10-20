import path from 'node:path'
import {startServer, stopServer} from 'passing-notes'
import {teardown} from 'passing-notes-ui'

export async function serveFixture(t, {path: fixturePath, port}) {
  const absoluteFixturePath = path.resolve(fixturePath)

  const {default: middleware} = await import(
    path.join(absoluteFixturePath, 'server.js')
  )

  const server = await startServer({port}, middleware)

  t.teardown(() => {
    stopServer(server)
    teardown(absoluteFixturePath)
  })
}
