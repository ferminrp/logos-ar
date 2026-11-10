import assert from 'node:assert/strict'
import { before, describe, it } from 'node:test'
import sharp from 'sharp'
import { ensureLogoDownloadCodecs } from './logo-download-codecs.ts'
import { convertRasterToPng } from './logo-download-png.ts'
import { measureImage } from './logo-quality/image-metrics.ts'

async function rgbaPng(color: string): Promise<{ buffer: ArrayBuffer; format: 'png' }> {
  const png = await sharp({
    create: {
      width: 48,
      height: 32,
      channels: 4,
      background: color,
    },
  })
    .png()
    .toBuffer()
  return { buffer: png.buffer.slice(png.byteOffset, png.byteOffset + png.byteLength), format: 'png' }
}

describe('convertRasterToPng', () => {
  before(async () => {
    await ensureLogoDownloadCodecs()
  })
  it('converts PNG with contain resize', async () => {
    const { buffer, format } = await rgbaPng('#336699')
    const out = await convertRasterToPng(buffer, 128, format)
    const metrics = measureImage(out)
    assert.equal(metrics.format, 'png')
    assert.ok(metrics.width <= 128 && metrics.height <= 128)
  })

  it('converts JPEG', async () => {
    const jpeg = await sharp({
      create: { width: 64, height: 64, channels: 3, background: '#cc4422' },
    })
      .jpeg()
      .toBuffer()
    const out = await convertRasterToPng(
      jpeg.buffer.slice(jpeg.byteOffset, jpeg.byteOffset + jpeg.byteLength),
      256,
      'jpeg',
    )
    assert.equal(measureImage(out).format, 'png')
  })

  it('converts WebP', async () => {
    const webp = await sharp({
      create: { width: 40, height: 60, channels: 3, background: '#22aa44' },
    })
      .webp()
      .toBuffer()
    const out = await convertRasterToPng(
      webp.buffer.slice(webp.byteOffset, webp.byteOffset + webp.byteLength),
      200,
      'webp',
    )
    assert.equal(measureImage(out).format, 'png')
  })

  it('converts GIF via photon fallback', async () => {
    const gif = await sharp({
      create: { width: 32, height: 32, channels: 3, background: '#ffcc00' },
    })
      .gif()
      .toBuffer()
    const out = await convertRasterToPng(
      gif.buffer.slice(gif.byteOffset, gif.byteOffset + gif.byteLength),
      128,
      'gif',
    )
    assert.equal(measureImage(out).format, 'png')
  })

  it('converts SVG via resvg', async () => {
    const svg = Buffer.from(
      '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="#2244aa"/></svg>',
    )
    const out = await convertRasterToPng(
      new TextEncoder().encode(
        '<svg xmlns="http://www.w3.org/2000/svg" width="80" height="40"><rect width="80" height="40" fill="#2244aa"/></svg>',
      ).buffer,
      128,
      'svg',
    )
    assert.equal(measureImage(out).format, 'png')
  })

  it('respects requested output sizes', async () => {
    const { buffer, format } = await rgbaPng('#111111')
    for (const size of [64, 128, 256, 512]) {
      const out = await convertRasterToPng(buffer, size, format)
      const metrics = measureImage(out)
      assert.ok(metrics.width <= size)
      assert.ok(metrics.height <= size)
    }
  })
})
