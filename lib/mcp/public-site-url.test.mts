import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { resolveMcpPublicSiteUrl } from './public-site-url.ts'

describe('resolveMcpPublicSiteUrl', () => {
  it('uses canonical https://loguitos.app on production host', () => {
    const url = resolveMcpPublicSiteUrl(
      new Request('https://loguitos.app/mcp'),
      {},
    )
    assert.equal(url, 'https://loguitos.app')
  })

  it('keeps preview origin for workers dev', () => {
    const url = resolveMcpPublicSiteUrl(
      new Request('https://abc123.loguitos.workers.dev/mcp'),
      {},
    )
    assert.equal(url, 'https://abc123.loguitos.workers.dev')
  })
})