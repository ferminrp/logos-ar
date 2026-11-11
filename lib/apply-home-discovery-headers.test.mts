import assert from 'node:assert/strict'
import test from 'node:test'
import {
  applyHomeDiscoveryHeaders,
  resolveWorkerSiteUrl,
} from './apply-home-discovery-headers.ts'

test('applyHomeDiscoveryHeaders adds Link and does not overwrite existing Link', () => {
  const base = applyHomeDiscoveryHeaders(
    new Response('ok', { status: 200 }),
    { pathname: '/', siteUrl: 'https://preview.example' },
  )
  const link = base.headers.get('link') ?? ''
  assert.match(link, /preview\.example/)

  const existing = applyHomeDiscoveryHeaders(
    new Response('ok', {
      status: 200,
      headers: { Link: '<https://custom.test/foo>; rel="alternate"' },
    }),
    { pathname: '/', siteUrl: 'https://preview.example' },
  )
  assert.equal(
    existing.headers.get('link'),
    '<https://custom.test/foo>; rel="alternate"',
  )
})

test('resolveWorkerSiteUrl prefers PUBLIC_SITE_URL binding', () => {
  assert.equal(
    resolveWorkerSiteUrl(new Request('https://pr-58-loguitos.example/'), {
      PUBLIC_SITE_URL: 'https://loguitos.app',
    }),
    'https://loguitos.app',
  )
  assert.equal(
    resolveWorkerSiteUrl(new Request('https://pr-58-loguitos.example/')),
    'https://pr-58-loguitos.example',
  )
})
