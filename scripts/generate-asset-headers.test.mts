import assert from 'node:assert/strict'
import test from 'node:test'
import {
  buildSitemapHeadersBlock,
  mergeDistClientHeaders,
  SITEMAP_CACHE_CONTROL,
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
