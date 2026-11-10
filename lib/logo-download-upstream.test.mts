import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import {
  buildLogoSourcePlan,
  fetchLogoUpstream,
  shouldFallbackToPublicFavicon,
} from './logo-download-upstream.ts'

const originalFetch = globalThis.fetch
const ctx = { origin: 'https://loguitos.test' }

describe('logo-download-upstream', () => {
  it('shouldFallbackToPublicFavicon on 403', () => {
    assert.equal(
      shouldFallbackToPublicFavicon('https://www.bbva.com.ar/favicon.ico', 403),
      true,
    )
    assert.equal(
      shouldFallbackToPublicFavicon(
        'https://s2.googleusercontent.com/s2/favicons?domain=bbva.com.ar&sz=128',
        403,
      ),
      false,
    )
  })

  it('buildLogoSourcePlan adds Google and DuckDuckGo fallbacks', () => {
    const plan = buildLogoSourcePlan(
      'https://example.com/logo.png',
      'bbva.com.ar',
      128,
      ctx,
    )
    assert.equal(plan.primaryUrl, 'https://example.com/logo.png')
    assert.ok(plan.fallbackUrls.some((u) => u.includes('googleusercontent.com')))
    assert.ok(plan.fallbackUrls.some((u) => u.includes('duckduckgo.com')))
  })

  describe('fetchLogoUpstream', () => {
    let calls: string[] = []

    beforeEach(() => {
      calls = []
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('bbva.com.ar/content/dam')) {
          return new Response('forbidden', { status: 403 })
        }
        if (url.includes('googleusercontent.com/s2/favicons')) {
          return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
            status: 200,
            headers: { 'Content-Type': 'image/png' },
          })
        }
        return new Response('missing', { status: 404 })
      }
    })

    afterEach(() => {
      globalThis.fetch = originalFetch
    })

    it('falls back to Google favicon when primary fetch throws', async () => {
      calls = []
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('www.bancopiano.com.ar/dist')) {
          throw new Error('TLS handshake failed')
        }
        if (url.includes('googleusercontent.com')) {
          return new Response(new Uint8Array([0x89, 0x50, 0x4e, 0x47]), {
            status: 200,
            headers: { 'Content-Type': 'image/png' },
          })
        }
        return new Response('missing', { status: 404 })
      }
      const res = await fetchLogoUpstream(
        'https://www.bancopiano.com.ar/dist/img/logo.png',
        'www.bancopiano.com.ar',
        128,
        ctx,
      )
      assert.equal(res.status, 200)
      assert.ok(calls.some((u) => u.includes('googleusercontent.com')))
    })

    it('falls back to Google favicon when primary returns 403', async () => {
      const res = await fetchLogoUpstream(
        'https://www.bbva.com.ar/content/dam/library/favicons/favicon.ico',
        'bbva.com.ar',
        128,
        ctx,
      )
      assert.equal(res.status, 200)
      assert.ok(calls.some((u) => u.includes('bbva.com.ar/content/dam')))
      assert.ok(calls.some((u) => u.includes('googleusercontent.com')))
    })
  })
})
