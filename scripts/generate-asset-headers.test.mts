import assert from 'node:assert/strict'
import { mkdtemp, readFile, rm } from 'node:fs/promises'
import os from 'node:os'
import path from 'node:path'
import test from 'node:test'
import {
  buildSitemapHeadersBlock,
  mergeDistClientHeaders,
  SITEMAP_CACHE_CONTROL,
  writeDistClientHeaders,
} from './generate-asset-headers.mts'

test('buildSitemapHeadersBlock includes next.config parity cache', () => {
  const block = buildSitemapHeadersBlock()
  assert.match(block, /\/sitemap\.xml/)
  assert.match(block, new RegExp(SITEMAP_CACHE_CONTROL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))
})

test('mergeDistClientHeaders preserves Astro _astro rules', () => {
  const input = `/_astro/*
  Cache-Control: public, max-age=31536000, immutable`
  const merged = mergeDistClientHeaders(input)
  assert.match(merged, /\/_astro\/\*/)
  assert.match(merged, /\/sitemap\.xml/)
})

test('mergeDistClientHeaders replaces stale sitemap block', () => {
  const input = `/_astro/*
  Cache-Control: immutable

/sitemap.xml
  Cache-Control: public, max-age=0`
  const merged = mergeDistClientHeaders(input)
  assert.doesNotMatch(merged, /max-age=0/)
  assert.match(merged, /max-age=86400/)
})

test('writeDistClientHeaders writes to an injected path (no dist/ required)', async () => {
  const dir = await mkdtemp(path.join(os.tmpdir(), 'loguitos-headers-'))
  try {
    const target = path.join(dir, 'client', '_headers')
    await writeDistClientHeaders(
      target,
      `/_astro/*
  Cache-Control: public, max-age=31536000, immutable`,
    )
    const body = await readFile(target, 'utf8')
    assert.match(body, /\/sitemap\.xml/)
    assert.match(body, /\/_astro\/\*/)
  } finally {
    await rm(dir, { recursive: true, force: true })
  }
})
