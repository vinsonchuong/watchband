import process from 'node:process'
import {mkdtemp} from 'node:fs/promises'
import {tmpdir} from 'node:os'
import path from 'node:path'
import install from 'quick-install'
import {startServer, stopServer, Logger, compose} from 'passing-notes'
import serveUi, {teardown} from 'passing-notes-ui'

export async function useServer(t, port, files) {
  const directory = await mkdtemp(path.join(tmpdir(), 'watchband-'))
  await install(process.cwd(), directory)
  await install(path.join(process.cwd(), 'node_modules', 'rxjs'), directory)
  const server = await startServer(
    {port},
    compose(
      serveUi({
        logger: new Logger(),
        path: directory,
        files,
      }),
      () => () => ({status: 404}),
    ),
  )

  t.teardown(() => {
    stopServer(server)
    teardown(directory)
  })
}
