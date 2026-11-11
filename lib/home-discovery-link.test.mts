import assert from 'node:assert/strict'
import test from 'node:test'
import { buildHomeLinkHeader } from './home-discovery-link.ts'

test('buildHomeLinkHeader uses explicit site URL', () => {
  const link = buildHomeLinkHeader('https://example.test')
  assert.match(link, /api-catalog/)
  assert.match(link, /\/api\/logos/)
})
