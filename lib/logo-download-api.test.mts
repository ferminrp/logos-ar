import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import sharp from 'sharp'
import { LOGO_SVG_CONTENT_SECURITY_POLICY } from './logo-image-security-headers.ts'
import {
  handleLogoDownloadGet,
  rasterDownloadFilename,
} from './logo-download-api.ts'
import { logoDownloadFilenameExtension } from './logo-download-attachment.ts'

const originalFetch = globalThis.fetch

describe('handleLogoDownloadGet', () => {
  beforeEach(() => {
    globalThis.fetch = async () => {
      const png = await sharp({
        create: { width: 32, height: 32, channels: 4, background: '#445566' },
      })
        .png()
        .toBuffer()
      return new Response(png, {
        headers: { 'Content-Type': 'image/png' },
      })
    }
  })

  afterEach(() => {
    globalThis.fetch = originalFetch
  })

  it('returns PNG attachment for valid domain', async () => {
    const req = new Request(
      'http://127.0.0.1/api/logo-download?domain=www.galicia.ar&format=png&size=128',
    )
    const res = await handleLogoDownloadGet(req)
    assert.equal(res.status, 200)
    assert.match(res.headers.get('Content-Type') ?? '', /^image\/png/)
    assert.match(res.headers.get('Content-Disposition') ?? '', /attachment/)
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff')
  })

  it('returns SVG download with security headers', async () => {
    const req = new Request(
      'http://127.0.0.1/api/logo-download?domain=www.galicia.ar&format=svg&size=128',
    )
    const res = await handleLogoDownloadGet(req)
    assert.equal(res.status, 200)
    assert.match(res.headers.get('Content-Type') ?? '', /image\/svg\+xml/)
    assert.equal(res.headers.get('X-Content-Type-Options'), 'nosniff')
    assert.equal(
      res.headers.get('Content-Security-Policy'),
      LOGO_SVG_CONTENT_SECURITY_POLICY,
    )
  })

  it('passthrough JPEG attachment must not use .png extension', () => {
    const name = rasterDownloadFilename('www.telecentro.com.ar', 'jpeg')
    assert.equal(name, 'www_telecentro_com_ar_logo.jpg')
    assert.notEqual(logoDownloadFilenameExtension(name), 'png')
  })

  it('isotipo download reads from ASSETS fallback path', async () => {
    const svg = '<svg xmlns="http://www.w3.org/2000/svg"/>'
    const req = new Request(
      'http://127.0.0.1/api/logo-download?domain=mercadopago.com.ar&format=isotipo',
    )
    const res = await handleLogoDownloadGet(req, {
      origin: 'https://loguitos.app',
      assets: {
        fetch: async (input) => {
          const url = new URL(
            typeof input === 'string'
              ? input
              : input instanceof URL
                ? input.href
                : input.url,
          )
          assert.equal(url.pathname, '/isotipos/mercado-pago.svg')
          return new Response(svg, {
            headers: { 'Content-Type': 'image/svg+xml' },
          })
        },
      },
    })
    assert.equal(res.status, 200)
    assert.match(res.headers.get('Content-Disposition') ?? '', /isotipo/)
    assert.equal(await res.text(), svg)
  })

  it('rejects invalid domain', async () => {
    const req = new Request(
      'http://127.0.0.1/api/logo-download?domain=not-a-real-domain.invalid&format=png',
    )
    const res = await handleLogoDownloadGet(req)
    assert.equal(res.status, 400)
  })
})
