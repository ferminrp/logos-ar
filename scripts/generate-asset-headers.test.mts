import assert from 'node:assert/strict'
import test from 'node:test'
import { buildAssetHeadersFile } from './generate-asset-headers.mts'

test('buildAssetHeadersFile includes sitemap cache parity with former next.config', () => {
  const body = buildAssetHeadersFile('https://loguitos.app')
  assert.match(
    body,
    /\/sitemap\.xml[\s\S]*max-age=86400, s-maxage=86400, stale-while-revalidate=604800/,
  )
})

test('buildAssetHeadersFile includes home Link discovery headers', () => {
  const body = buildAssetHeadersFile('https://example.test')
  assert.match(body, /api-catalog/)
  assert.match(body, /\/api\/logos/)
})
