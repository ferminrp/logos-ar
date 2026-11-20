import assert from 'node:assert/strict'
import { mkdtemp, writeFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  md5Hex,
  slugFromPublicLogoFile,
  localExtension,
  syncLogosToR2WithDeps,
  type SyncLogosDeps,
} from './sync-logos-to-r2.mts'
import { r2ObjectKeyForHostedLogo } from '../lib/worker-logos-r2.ts'
import { shouldSkipLogoUpload } from '../lib/sync-logos-r2-remote.ts'

test('slugFromPublicLogoFile normalizes hosted file names', () => {
  assert.equal(slugFromPublicLogoFile('mercado-pago.png'), 'mercado-pago')
  assert.equal(slugFromPublicLogoFile('Ripio.SVG'), 'ripio')
  assert.equal(slugFromPublicLogoFile('bad_slug.png'), null)
})

test('localExtension maps png and svg only', () => {
  assert.equal(localExtension('a.png'), 'png')
  assert.equal(localExtension('a.svg'), 'svg')
  assert.equal(localExtension('a.webp'), null)
})

test('md5Hex and R2 keys align with worker mapping', () => {
  const bytes = new Uint8Array([1, 2, 3])
  assert.match(md5Hex(bytes), /^[a-f0-9]{32}$/)
  assert.equal(
    r2ObjectKeyForHostedLogo('mercado-pago', 'png'),
    'loguitos.app/logos/mercado-pago/logo.png',
  )
})

test('syncLogosToR2WithDeps skips upload when listed etag matches local file', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'loguitos-sync-'))
  try {
    const bytes = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const filePath = path.join(dir, 'ripio.png')
    await writeFile(filePath, bytes)
    const digest = md5Hex(bytes)
    const key = r2ObjectKeyForHostedLogo('ripio', 'png')
    assert.equal(shouldSkipLogoUpload(digest, digest), true)

    let puts = 0
    const deps: SyncLogosDeps = {
      loadRemoteEtags: async () => new Map([[key, digest]]),
      remoteMd5ForKey: async () => {
        throw new Error('get should not run when list etag matches')
      },
      putObject: async () => {
        puts += 1
      },
    }

    const result = await syncLogosToR2WithDeps(deps, dir)
    assert.equal(result.skipped, 1)
    assert.equal(result.uploaded, 0)
    assert.equal(puts, 0)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})

test('syncLogosToR2WithDeps uploads when remote etag differs', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'loguitos-sync-'))
  try {
    const bytes = new Uint8Array([1, 2, 3, 4])
    await writeFile(path.join(dir, 'ripio.png'), bytes)
    const key = r2ObjectKeyForHostedLogo('ripio', 'png')

    let puts = 0
    const deps: SyncLogosDeps = {
      loadRemoteEtags: async () =>
        new Map([[key, '00000000000000000000000000000000']]),
      remoteMd5ForKey: async () => null,
      putObject: async () => {
        puts += 1
      },
    }

    const result = await syncLogosToR2WithDeps(deps, dir)
    assert.equal(result.uploaded, 1)
    assert.equal(result.skipped, 0)
    assert.equal(puts, 1)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})