import assert from 'node:assert/strict'
import { afterEach, beforeEach, describe, it } from 'node:test'
import sharp from 'sharp'
import { handleLogoDownloadGet } from './logo-download-api.ts'

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
  })

  it('rejects invalid domain', async () => {
    const req = new Request(
      'http://127.0.0.1/api/logo-download?domain=not-a-real-domain.invalid&format=png',
    )
    const res = await handleLogoDownloadGet(req)
    assert.equal(res.status, 400)
  })
})
