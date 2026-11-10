import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import { collectFaviconDomainCandidates } from './favicon-urls.ts'
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

  it('collectFaviconDomainCandidates strips www and adds logo URL host', () => {
    const domains = collectFaviconDomainCandidates(
      'www.telecentro.com.ar',
      'https://telecentro.com.ar/img/meta-image.jpg',
    )
    assert.deepEqual(domains, [
      'www.telecentro.com.ar',
      'telecentro.com.ar',
    ])
    const plan = buildLogoSourcePlan(
      'https://telecentro.com.ar/img/meta-image.jpg',
      'www.telecentro.com.ar',
      128,
      ctx,
    )
    assert.ok(
      plan.fallbackUrls.some((u) =>
        u.includes('domain=telecentro.com.ar'),
      ),
    )
    assert.ok(
      plan.fallbackUrls.some((u) =>
        u.includes('ip3/telecentro.com.ar.ico'),
      ),
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

    it('returns 404 when primary was 404 and fallbacks exhausted', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('missing.example/logo')) {
          return new Response('missing', { status: 404 })
        }
        return new Response('missing', { status: 404 })
      }
      const { response: res } = await fetchLogoUpstream(
        'https://missing.example/logo.png',
        'missing.example',
        128,
        ctx,
      )
      assert.equal(res.status, 404)
    })

    it('falls back to bare domain favicon when www.google returns 404 (telecentro)', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('telecentro.com.ar/img/meta-image')) {
          const jpeg = new Uint8Array([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b,
            0x08, 0x04, 0x38, 0x04, 0x38, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9,
          ])
          return new Response(jpeg, {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          })
        }
        if (url.includes('domain=www.telecentro.com.ar')) {
          return new Response('missing', { status: 404 })
        }
        if (url.includes('www.telecentro.com.ar.ico')) {
          return new Response('missing', { status: 404 })
        }
        if (url.includes('domain=telecentro.com.ar')) {
          return pngResponse()
        }
        return new Response('missing', { status: 404 })
      }
      const { response: res } = await fetchLogoUpstream(
        'https://telecentro.com.ar/img/meta-image.jpg',
        'www.telecentro.com.ar',
        128,
        ctx,
        { decodeBudget: { targetPngSize: 128 } },
      )
      assert.equal(res.status, 200)
      assert.ok(calls.some((u) => u.includes('domain=telecentro.com.ar')))
    })

    it('delivers original raster when fallbacks fail but primary over wasm budget', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        if (url.includes('big.example/hero.jpg')) {
          const jpeg = new Uint8Array([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b,
            0x08, 0x04, 0x38, 0x04, 0x38, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9,
          ])
          return new Response(jpeg, {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          })
        }
        return new Response('missing', { status: 404 })
      }
      const { response: res, deliverOriginalRaster } = await fetchLogoUpstream(
        'https://big.example/hero.jpg',
        'big.example',
        128,
        ctx,
        { decodeBudget: { targetPngSize: 128 } },
      )
      assert.equal(res.status, 200)
      assert.equal(deliverOriginalRaster, true)
      assert.match(res.headers.get('content-type') ?? '', /jpeg/)
    })

    it('falls back when primary JPEG exceeds Workers wasm budget', async () => {
      globalThis.fetch = async (input: RequestInfo | URL) => {
        const url = String(input)
        calls.push(url)
        if (url.includes('subaru.com.ar/subaru/site')) {
          const jpeg = new Uint8Array([
            0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01,
            0x01, 0x00, 0x00, 0x01, 0x00, 0x01, 0x00, 0x00, 0xff, 0xc0, 0x00, 0x0b,
            0x08, 0x0b, 0xb8, 0x0b, 0xb8, 0x01, 0x01, 0x11, 0x00, 0xff, 0xd9,
          ])
          return new Response(jpeg, {
            status: 200,
            headers: { 'Content-Type': 'image/jpeg' },
          })
        }
        if (url.includes('googleusercontent.com')) {
          return pngResponse()
        }
        return new Response('missing', { status: 404 })
      }
      const { response: res } = await fetchLogoUpstream(
        'https://www.subaru.com.ar/subaru/site/artic/logo.jpg',
        'subaru.com.ar',
        128,
        ctx,
        { decodeBudget: { targetPngSize: 128 } },
      )
      assert.equal(res.status, 200)
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
