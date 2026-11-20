import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { maybePermanentSlugRedirect } from './worker-permanent-redirect.ts'

describe('maybePermanentSlugRedirect', () => {
  it('redirects consolidated logo asset paths', () => {
    const res = maybePermanentSlugRedirect(
      new Request('https://loguitos.app/logos/metrogas/isotipo.svg'),
    )
    assert.ok(res)
    assert.equal(res.status, 308)
    assert.equal(res.headers.get('location'), 'https://loguitos.app/logos/metrogas-214/isotipo.svg')
  })
})