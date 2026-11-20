import { env, SELF } from 'cloudflare:test'
import { beforeAll, describe, expect, it } from 'vitest'
import { LOGO_SVG_CONTENT_SECURITY_POLICY } from '../lib/logo-image-security-headers.ts'
import { r2ObjectKeyForHostedLogo } from '../lib/worker-logos-r2.ts'

const PNG = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])

const SVG = new TextEncoder().encode(
  '<svg xmlns="http://www.w3.org/2000/svg"><rect width="10" height="10"/></svg>',
)

beforeAll(async () => {
  const key = r2ObjectKeyForHostedLogo('workerd-hit', 'png')
  await env.LOGOS.put(key, PNG, {
    httpMetadata: {
      contentType: 'image/png',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })
  const svgKey = r2ObjectKeyForHostedLogo('workerd-hit', 'svg')
  await env.LOGOS.put(svgKey, SVG, {
    httpMetadata: {
      contentType: 'image/svg+xml',
      cacheControl: 'public, max-age=31536000, immutable',
    },
  })
})

describe('hosted logos in workerd', () => {
  it('serves object from R2 binding', async () => {
    const res = await SELF.fetch('https://example.com/logos/workerd-hit.png')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
    expect(res.headers.get('cache-control')).toContain('immutable')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    const bytes = new Uint8Array(await res.arrayBuffer())
    expect(bytes[0]).toBe(0x89)
  })

  it('serves SVG from R2 with security headers', async () => {
    const res = await SELF.fetch('https://example.com/logos/workerd-hit.svg')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/svg+xml')
    expect(res.headers.get('x-content-type-options')).toBe('nosniff')
    expect(res.headers.get('content-security-policy')).toBe(
      LOGO_SVG_CONTENT_SECURITY_POLICY,
    )
    await res.arrayBuffer()
  })

  it('returns 304 from R2 etag', async () => {
    const head = await SELF.fetch('https://example.com/logos/workerd-hit.png', {
      method: 'HEAD',
    })
    const etag = head.headers.get('etag')
    expect(etag).toBeTruthy()
    const res = await SELF.fetch('https://example.com/logos/workerd-hit.png', {
      headers: { 'If-None-Match': etag! },
    })
    expect(res.status).toBe(304)
  })

  it('falls back to ASSETS when R2 misses', async () => {
    const res = await SELF.fetch('https://example.com/logos/fallback-tile.png')
    expect(res.status).toBe(200)
    expect(res.headers.get('content-type')).toBe('image/png')
  })

  it('returns 404 when missing everywhere', async () => {
    const res = await SELF.fetch('https://example.com/logos/definitely-missing-slug.png')
    expect(res.status).toBe(404)
  })

  it('returns 404 for invalid slug', async () => {
    const res = await SELF.fetch('https://example.com/logos/bad_slug.png')
    expect(res.status).toBe(404)
  })

  it('HEAD from R2 without body', async () => {
    const res = await SELF.fetch('https://example.com/logos/workerd-hit.png', {
      method: 'HEAD',
    })
    expect(res.status).toBe(200)
    expect(res.headers.get('content-length')).toBeTruthy()
    expect((await res.arrayBuffer()).byteLength).toBe(0)
  })
})