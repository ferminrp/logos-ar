import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { LOGO_SVG_CONTENT_SECURITY_POLICY } from './logo-image-security-headers.ts'
import {
  HOSTED_LOGO_CACHE_CONTROL,
  isValidHostedLogoSlug,
  maybeServeHostedLogo,
  parseHostedLogoPathname,
  parseIsotipoPathname,
  r2ObjectKeyForHostedLogo,
  type HostedLogoWorkerEnv,
  type LogosR2Bucket,
} from './worker-logos-r2.ts'
import { hasCatalogIsotipo, r2ObjectKeyForIsotipo } from './isotipos-catalog.ts'

describe('worker-logos-r2 parsing', () => {
  it('parses flat hosted logo paths', () => {
    assert.deepEqual(parseHostedLogoPathname('/logos/mercado-pago.png'), {
      slug: 'mercado-pago',
      ext: 'png',
    })
    assert.deepEqual(parseHostedLogoPathname('/logos/ripio.svg'), {
      slug: 'ripio',
      ext: 'svg',
    })
  })

  it('rejects nested paths and invalid slugs', () => {
    assert.equal(parseHostedLogoPathname('/logos/a/b.png'), null)
    assert.equal(parseHostedLogoPathname('/logos/../x.png'), null)
    assert.equal(parseHostedLogoPathname('/logos/UPPER.png'), null)
    assert.equal(isValidHostedLogoSlug('ok-slug-1'), true)
    assert.equal(isValidHostedLogoSlug('bad_slug'), false)
  })

  it('parses isotipo hosted paths', () => {
    assert.deepEqual(parseIsotipoPathname('/logos/mercado-pago/isotipo.svg'), {
      slug: 'mercado-pago',
    })
    assert.equal(parseIsotipoPathname('/logos/mercado-pago.svg'), null)
    assert.equal(parseIsotipoPathname('/logos/a/b/isotipo.svg'), null)
  })

  it('builds canonical R2 keys', () => {
    assert.equal(
      r2ObjectKeyForHostedLogo('naranja-x', 'png'),
      'loguitos.app/logos/naranja-x/logo.png',
    )
    assert.equal(
      r2ObjectKeyForHostedLogo('naranja-x', 'svg'),
      'loguitos.app/logos/naranja-x/logo.svg',
    )
  })
})

function mockR2(objects: Map<string, { body: Uint8Array; etag: string }>): LogosR2Bucket {
  return {
    async head(key) {
      const hit = objects.get(key)
      if (!hit) return null
      return {
        key,
        version: 'v1',
        size: hit.body.byteLength,
        etag: hit.etag,
        httpEtag: `"${hit.etag}"`,
        uploaded: new Date(),
        httpMetadata: {},
        customMetadata: {},
        checksums: {},
        storageClass: 'Standard',
      }
    },
    async get(key) {
      const hit = objects.get(key)
      if (!hit) return null
      return {
        key,
        version: 'v1',
        size: hit.body.byteLength,
        etag: hit.etag,
        httpEtag: `"${hit.etag}"`,
        uploaded: new Date(),
        body: hit.body,
        httpMetadata: {},
        customMetadata: {},
        checksums: {},
        storageClass: 'Standard',
      }
    },
  }
}

describe('maybeServeHostedLogo', () => {
  const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47])

  function env(r2: LogosR2Bucket | undefined, assetsFetch: HostedLogoWorkerEnv['ASSETS']['fetch']): HostedLogoWorkerEnv {
    return { LOGOS: r2, ASSETS: { fetch: assetsFetch } }
  }

  it('serves from R2 with cache headers', async () => {
    const key = r2ObjectKeyForHostedLogo('ripio', 'png')
    const r2 = mockR2(new Map([[key, { body: PNG, etag: 'abc123' }]]))
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/ripio.png'),
      env(r2, async () => new Response('missing', { status: 404 })),
    )
    assert.equal(res?.status, 200)
    assert.equal(res?.headers.get('content-type'), 'image/png')
    assert.equal(res?.headers.get('cache-control'), HOSTED_LOGO_CACHE_CONTROL)
    assert.equal(res?.headers.get('etag'), '"abc123"')
    assert.equal(res?.headers.get('x-content-type-options'), 'nosniff')
  })

  it('returns 304 when If-None-Match matches R2 etag', async () => {
    const key = r2ObjectKeyForHostedLogo('ripio', 'png')
    const r2 = mockR2(new Map([[key, { body: PNG, etag: 'abc123' }]]))
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/ripio.png', {
        headers: { 'If-None-Match': '"abc123"' },
      }),
      env(r2, async () => new Response('missing', { status: 404 })),
    )
    assert.equal(res?.status, 304)
  })

  it('falls back to ASSETS when R2 misses', async () => {
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/ripio.png'),
      env(undefined, async () => new Response(PNG, { status: 200, headers: { 'Content-Type': 'image/png' } })),
    )
    assert.equal(res?.status, 200)
    assert.equal(res?.headers.get('cache-control'), HOSTED_LOGO_CACHE_CONTROL)
  })

  it('returns 404 for invalid slug shape', async () => {
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/bad_slug.png'),
      env(undefined, async () => new Response('nope', { status: 404 })),
    )
    assert.equal(res?.status, 404)
  })

  it('returns 404 when R2 and ASSETS miss', async () => {
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/nope.png'),
      env(mockR2(new Map()), async () => new Response('missing', { status: 404 })),
    )
    assert.equal(res?.status, 404)
  })

  it('supports HEAD from R2 without body', async () => {
    const key = r2ObjectKeyForHostedLogo('ripio', 'png')
    const r2 = mockR2(new Map([[key, { body: PNG, etag: 'abc123' }]]))
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/ripio.png', { method: 'HEAD' }),
      env(r2, async () => new Response(null, { status: 404 })),
    )
    assert.equal(res?.status, 200)
    assert.equal(res?.headers.get('content-length'), String(PNG.byteLength))
    const bytes = new Uint8Array(await res!.arrayBuffer())
    assert.equal(bytes.byteLength, 0)
  })

  it('adds SVG security headers from R2', async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const key = r2ObjectKeyForHostedLogo('ripio', 'svg')
    const r2 = mockR2(new Map([[key, { body: svg, etag: 'svg1' }]]))
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/ripio.svg'),
      env(r2, async () => new Response('missing', { status: 404 })),
    )
    assert.equal(res?.headers.get('content-type'), 'image/svg+xml')
    assert.equal(res?.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(
      res?.headers.get('content-security-policy'),
      LOGO_SVG_CONTENT_SECURITY_POLICY,
    )
  })

  it('adds SVG security headers on ASSETS fallback', async () => {
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/fallback.svg'),
      env(undefined, async () =>
        new Response(svg, {
          status: 200,
          headers: { 'Content-Type': 'image/svg+xml' },
        }),
      ),
    )
    assert.equal(res?.headers.get('x-content-type-options'), 'nosniff')
    assert.equal(
      res?.headers.get('content-security-policy'),
      LOGO_SVG_CONTENT_SECURITY_POLICY,
    )
  })

  it('serves isotipo from R2 with SVG security headers', async () => {
    if (!hasCatalogIsotipo('mercado-pago')) {
      return
    }
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const key = r2ObjectKeyForIsotipo('mercado-pago')
    const r2 = mockR2(new Map([[key, { body: svg, etag: 'iso1' }]]))
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/mercado-pago/isotipo.svg'),
      env(r2, async () => new Response('missing', { status: 404 })),
    )
    assert.equal(res?.status, 200)
    assert.equal(res?.headers.get('content-type'), 'image/svg+xml')
    assert.equal(
      res?.headers.get('content-security-policy'),
      LOGO_SVG_CONTENT_SECURITY_POLICY,
    )
  })

  it('falls back isotipo to ASSETS under /isotipos/', async () => {
    if (!hasCatalogIsotipo('mercado-pago')) {
      return
    }
    const svg = new TextEncoder().encode('<svg xmlns="http://www.w3.org/2000/svg"/>')
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/mercado-pago/isotipo.svg'),
      env(
        undefined,
        async (input) => {
          const href =
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : input.url
          const url = new URL(href)
          if (url.pathname === '/isotipos/mercado-pago.svg') {
            return new Response(svg, {
              status: 200,
              headers: { 'Content-Type': 'image/svg+xml' },
            })
          }
          return new Response('missing', { status: 404 })
        },
      ),
    )
    assert.equal(res?.status, 200)
    assert.equal(res?.headers.get('x-content-type-options'), 'nosniff')
  })

  it('404 isotipo for catalog slug without isotipo', async () => {
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logos/zzz-not-an-isotipo/isotipo.svg'),
      env(undefined, async () => new Response('missing', { status: 404 })),
    )
    assert.equal(res?.status, 404)
  })

  it('returns null for unrelated paths', async () => {
    const res = await maybeServeHostedLogo(
      new Request('https://loguitos.app/logo/ripio'),
      env(undefined, async () => new Response('nope', { status: 404 })),
    )
    assert.equal(res, null)
  })
})