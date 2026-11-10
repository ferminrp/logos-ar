import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import {
  buildLogoSourcePlan,
  fetchLogoUpstream,
  shouldFallbackToPublicFavicon,
} from './logo-download-upstream.ts'

const originalFetch = globalThis.fetch
const ctx = { origin: 'https://loguitos.test' }
const TINY_PNG = Uint8Array.from(
  atob(
    'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==',
  ),
  (c) => c.charCodeAt(0),
)

function pngResponse(): Response {
  return new Response(TINY_PNG, {
    status: 200,
    headers: { 'Content-Type': 'image/png' },
  })
}

describe('logo-download-upstream', () => {
  it('shouldFallbackToPublicFavicon on 5xx including 500 and 501', () => {
    assert.equal(
      shouldFallbackToPublicFavicon('https://www.subaru.com.ar/logo.jpg', 500),
      true,
    )
    assert.equal(
      shouldFallbackToPublicFavicon('https://www.subaru.com.ar/logo.jpg', 501),
      true,
    )
    assert.equal(
      shouldFallbackToPublicFavicon('https://www.subaru.com.ar/logo.jpg', 503),
      true,
    )
  })

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
          return pngResponse()
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
          return pngResponse()
        }
        return new Response('missing', { status: 404 })
      }
      const { response: res } = await fetchLogoUpstream(
        'https://www.bancopiano.com.ar/dist/img/logo.png',
        'www.bancopiano.com.ar',
        128,
        ctx,
      )
      assert.equal(res.status, 200)
      assert.ok(calls.some((u) => u.includes('googleusercontent.com')))
    })

    it('falls back to Google favicon when primary returns 403', async () => {
      const { response: res } = await fetchLogoUpstream(
        'https://www.bbva.com.ar/content/dam/library/favicons/favicon.ico',
        'bbva.com.ar',
        128,
        ctx,
      )
      assert.equal(res.status, 200)
      assert.ok(calls.some((u) => u.includes('bbva.com.ar/content/dam')))
      assert.ok(calls.some((u) => u.includes('googleusercontent.com')))
    })

    it('falls back to Google when primary returns HTTP 503 (subaru)', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('subaru.com.ar/subaru/site')) {
          return new Response('unavailable', { status: 503 })
        }
        if (url.includes('googleusercontent.com/s2/favicons')) {
          return pngResponse()
        }
        return new Response('missing', { status: 404 })
      }
      const { response: res } = await fetchLogoUpstream(
        'https://www.subaru.com.ar/subaru/site/artic/20190503/imag/foto_0000000120190503133300/logo.jpg',
        'subaru.com.ar',
        128,
        ctx,
      )
      assert.equal(res.status, 200)
      assert.ok(calls.some((u) => u.includes('subaru.com.ar')))
      assert.ok(calls.some((u) => u.includes('googleusercontent.com')))
    })

    it('falls back when primary returns 200 HTML instead of an image', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('example.com/logo')) {
          return new Response('<html></html>', {
            status: 200,
            headers: { 'Content-Type': 'text/html' },
          })
        }
        if (url.includes('googleusercontent.com')) {
          return pngResponse()
        }
        return new Response('missing', { status: 404 })
      }
      const { response: res } = await fetchLogoUpstream(
        'https://example.com/logo',
        'example.com',
        128,
        ctx,
      )
      assert.equal(res.status, 200)
      assert.ok(calls.some((u) => u.includes('googleusercontent.com')))
    })
  })
})
