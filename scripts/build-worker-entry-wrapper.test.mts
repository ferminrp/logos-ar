import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL } from 'node:url'
import test from 'node:test'
import { buildHomeLinkHeader } from '../lib/home-discovery-link.ts'
import { buildHomeLinkHeaderWorkerModuleSource } from './build-worker-entry-wrapper.mts'

test('worker home-link module matches lib buildHomeLinkHeader', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'loguitos-home-link-'))
  const modPath = path.join(dir, 'home-link-header.mjs')
  await writeFile(modPath, buildHomeLinkHeaderWorkerModuleSource(), 'utf8')
  try {
    const workerMod = (await import(pathToFileURL(modPath).href)) as {
      buildHomeLinkHeader: (siteUrl?: string) => string
    }
    const sample = 'https://preview.example'
    assert.equal(workerMod.buildHomeLinkHeader(sample), buildHomeLinkHeader(sample))
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
