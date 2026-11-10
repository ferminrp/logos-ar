import type { ImageMetrics } from './logo-quality/image-metrics.ts'
import { ensureLogoDownloadCodecs } from './logo-download-codecs.ts'
import { PhotonImage } from '@cf-wasm/photon'
import decodeJpeg from '@jsquash/jpeg/decode.js'
import decodePng from '@jsquash/png/decode.js'
import encodePng from '@jsquash/png/encode.js'
import resizeImage from '@jsquash/resize'

async function svgToPngBytes(source: ArrayBuffer): Promise<Uint8Array> {
  await ensureLogoDownloadCodecs()
  const { Resvg } = await import('@resvg/resvg-wasm')
  const svg = new TextDecoder().decode(new Uint8Array(source))
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } })
  return resvg.render().asPng()
}

async function rasterBytesToImageData(
  source: ArrayBuffer,
  format: ImageMetrics['format'],
): Promise<ImageData> {
  if (format === 'svg') {
    const pngBytes = await svgToPngBytes(source)
    return decodePng(pngBytes)
  }

  if (format === 'jpeg') {
    return decodeJpeg(source)
  }

  if (format === 'webp') {
    const decodeWebp = (await import('@jsquash/webp/decode.js')).default
    return decodeWebp(source)
  }

  if (format === 'png') {
    return decodePng(source)
  }

  const inputImage = PhotonImage.new_from_byteslice(new Uint8Array(source))
  try {
    const pngBytes = inputImage.get_bytes()
    return decodePng(pngBytes)
  } finally {
    inputImage.free()
  }
}

export async function convertRasterToPng(
  source: ArrayBuffer,
  size: number,
  format: ImageMetrics['format'],
): Promise<Uint8Array> {
  if (format === 'unknown' || format === 'ico') {
    throw new Error(`unsupported format: ${format}`)
  }

  await ensureLogoDownloadCodecs()
  const imageData = await rasterBytesToImageData(source, format)
  const resized = await resizeImage(imageData, {
    width: size,
    height: size,
    method: 'lanczos3',
    fitMethod: 'contain',
    premultiply: true,
    linearRGB: true,
  })
  const pngBytes = await encodePng(resized)
  return pngBytes instanceof Uint8Array
    ? pngBytes
    : new Uint8Array(pngBytes as ArrayBuffer)
}
