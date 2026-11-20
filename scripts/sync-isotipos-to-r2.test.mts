import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { syncIsotiposToR2, parseSyncIsotiposCliArgs } from './sync-isotipos-to-r2.mts'
import { ISOTIPO_SLUGS } from '../lib/isotipos-catalog.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const FIXTURE_DIR = path.join(REPO_ROOT, 'test/fixtures/isotipo-sync')

describe('sync-isotipos-to-r2', () => {
  it('parses --dry-run', () => {
    assert.equal(parseSyncIsotiposCliArgs(['--dry-run']).dryRun, true)
    assert.equal(parseSyncIsotiposCliArgs([]).dryRun, false)
  })

  it('refuses slugs that are not in logos-dataset', async () => {
    const result = await syncIsotiposToR2({
      dryRun: true,
      isotiposDir: FIXTURE_DIR,
    })
    assert.ok(result.refused >= 1)
    assert.equal(result.errors, 0)
  })

  it('dry-run covers all catalog isotipos without refuses', async () => {
    const result = await syncIsotiposToR2({
      dryRun: true,
      isotiposDir: path.join(REPO_ROOT, 'data/isotipos'),
    })
    assert.equal(result.errors, 0)
    assert.equal(result.refused, 0)
    assert.equal(result.skipped + result.uploaded, ISOTIPO_SLUGS.size)
  })
})