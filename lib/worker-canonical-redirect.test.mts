import assert from 'node:assert/strict'
import test from 'node:test'
import { maybeCanonicalRedirect } from './worker-canonical-redirect.ts'

test('maybeCanonicalRedirect www→apex preserves path and query', () => {
  const res = maybeCanonicalRedirect(
    new Request('https://www.loguitos.app/logo/galicia?q=1'),
  )
  assert.ok(res)
  assert.equal(res.status, 301)
  assert.equal(res.headers.get('location'), 'https://loguitos.app/logo/galicia?q=1')
})

test('maybeCanonicalRedirect http www→https apex in one hop', () => {
  const res = maybeCanonicalRedirect(new Request('http://www.loguitos.app/foo?bar=1'))
  assert.ok(res)
  assert.equal(res.status, 301)
  assert.equal(res.headers.get('location'), 'https://loguitos.app/foo?bar=1')
})

test('maybeCanonicalRedirect http apex→https apex', () => {
  const res = maybeCanonicalRedirect(new Request('http://loguitos.app/'))
  assert.ok(res)
  assert.equal(res.headers.get('location'), 'https://loguitos.app/')
})

test('maybeCanonicalRedirect skips preview hostnames', () => {
  assert.equal(
    maybeCanonicalRedirect(new Request('http://pr-58-loguitos.example.workers.dev/')),
    null,
  )
})

test('maybeCanonicalRedirect no loop on canonical https apex', () => {
  assert.equal(maybeCanonicalRedirect(new Request('https://loguitos.app/')), null)
})