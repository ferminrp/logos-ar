import assert from 'node:assert/strict'
import test from 'node:test'
import { maybeCanonicalRedirect } from './worker-canonical-redirect.ts'

test('maybeCanonicalRedirect www→apex resolves retired slug in one hop', () => {
  const res = maybeCanonicalRedirect(
    new Request('https://www.loguitos.app/logo/galicia?q=1'),
  )
  assert.ok(res)
  assert.equal(res.status, 301)
  assert.equal(res.headers.get('location'), 'https://loguitos.app/logo/banco-galicia?q=1')
})

test('maybeCanonicalRedirect http www→https apex in one hop', () => {
  const res = maybeCanonicalRedirect(new Request('http://www.loguitos.app/foo?bar=1'))
  assert.ok(res)
  assert.equal(res.status, 301)
  assert.equal(res.headers.get('location'), 'https://loguitos.app/foo?bar=1')
})

test('maybeCanonicalRedirect http www retired banco-provincia alias in one hop', () => {
  const res = maybeCanonicalRedirect(
    new Request('http://www.loguitos.app/logo/banco-provincia-bs-as/'),
  )
  assert.ok(res)
  assert.equal(res.status, 301)
  assert.equal(
    res.headers.get('location'),
    'https://loguitos.app/logo/banco-provincia',
  )
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

test('maybeCanonicalRedirect ignores protocol-relative paths', () => {
  assert.equal(
    maybeCanonicalRedirect(new Request('https://www.loguitos.app//evil.example/path')),
    null,
  )
})