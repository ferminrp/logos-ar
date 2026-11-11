import assert from 'node:assert/strict'
import test from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { mkdtemp, readFile, writeFile } from 'node:fs/promises'
import { tmpdir } from 'node:os'
import {
  WORKER_WRAPPER_MAIN,
  buildWorkerEntryWrapper,
} from './build-worker-entry-wrapper.mts'
import { verifyWorkerDeployEntry } from './verify-worker-deploy-entry.mts'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')

test('verifyWorkerDeployEntry after postbuild wrapper', { skip: !process.env.FULL_BUILD_TEST }, async () => {
  await verifyWorkerDeployEntry()
})

test('dist wrangler main is wrapper after buildWorkerEntryWrapper', async () => {
  const serverRoot = await mkdtemp(path.join(tmpdir(), 'worker-wrapper-test-'))
  await writeFile(
    path.join(serverRoot, 'wrangler.json'),
    `${JSON.stringify({ main: 'entry.mjs', name: 'test-worker' })}\n`,
  )
  await buildWorkerEntryWrapper(serverRoot)
  const wrangler = JSON.parse(
    await readFile(path.join(serverRoot, 'wrangler.json'), 'utf8'),
  ) as { main?: string }
  assert.equal(wrangler.main, WORKER_WRAPPER_MAIN)
})
