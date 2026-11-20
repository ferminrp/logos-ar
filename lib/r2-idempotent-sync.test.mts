import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { runIdempotentR2Sync } from './r2-idempotent-sync.ts'
import { md5Hex } from './sync-r2-digest.ts'

describe('runIdempotentR2Sync', () => {
  it('skips unchanged objects by etag', async () => {
    const bytes = new TextEncoder().encode('same')
    const digest = md5Hex(bytes)
    const puts: string[] = []

    const result = await runIdempotentR2Sync(
      {
        loadRemoteEtags: async () =>
          new Map([['key-a', digest]]),
        remoteMd5ForKey: async () => null,
        putObject: async (ctx) => {
          puts.push(ctx.objectKey)
        },
      },
      [
        {
          objectKey: 'key-a',
          filePath: '/tmp/a.svg',
          contentType: 'image/svg+xml',
          bytes,
        },
      ],
    )

    assert.equal(result.skipped, 1)
    assert.equal(result.uploaded, 0)
    assert.deepEqual(puts, [])
  })

  it('dry-run counts would-upload without calling put', async () => {
    const bytes = new TextEncoder().encode('new')
    const puts: string[] = []

    const result = await runIdempotentR2Sync(
      {
        loadRemoteEtags: async () => new Map(),
        remoteMd5ForKey: async () => null,
        putObject: async (ctx) => {
          puts.push(ctx.objectKey)
        },
      },
      [
        {
          objectKey: 'key-b',
          filePath: '/tmp/b.svg',
          contentType: 'image/svg+xml',
          bytes,
        },
      ],
      { dryRun: true },
    )

    assert.equal(result.uploaded, 1)
    assert.deepEqual(puts, [])
  })
})