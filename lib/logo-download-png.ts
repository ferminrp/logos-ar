import type { ImageMetrics } from './logo-quality/image-metrics.ts'
import { ensureLogoDownloadCodecs } from './logo-download-codecs.ts'
import { PhotonImage } from '@cf-wasm/photon'
import decodeJpeg from '@jsquash/jpeg/decode.js'
import decodePng from '@jsquash/png/decode.js'
import encodePng from '@jsquash/png/encode.js'
import resizeImage from '@jsquash/resize'

function rasterArrayBuffer(input: ArrayBuffer | Uint8Array<ArrayBufferLike>): ArrayBuffer {
  if (input instanceof ArrayBuffer) {
    return input
  }
  return input.buffer.slice(
    input.byteOffset,
    input.byteOffset + input.byteLength,
  ) as ArrayBuffer
}

async function svgToPngBytes(source: ArrayBuffer): Promise<Uint8Array> {
  await ensureLogoDownloadCodecs()
  const { Resvg } = await import('@resvg/resvg-wasm')
  const svg = new TextDecoder().decode(new Uint8Array(source))
  const resvg = new Resvg(svg, { fitTo: { mode: 'width', value: 512 } })
  return resvg.render().asPng()
}

function decodeRasterWithPhoton(source: ArrayBuffer): Promise<ImageData> {
  const inputImage = PhotonImage.new_from_byteslice(new Uint8Array(source))
  try {
    const pngBytes = inputImage.get_bytes()
    return decodePng(rasterArrayBuffer(pngBytes))
  } finally {
    inputImage.free()
  }
}

async function rasterBytesToImageData(
  source: ArrayBuffer,
  format: ImageMetrics['format'],
): Promise<ImageData> {
  if (format === 'svg') {
    const pngBytes = await svgToPngBytes(source)
    return decodePng(rasterArrayBuffer(pngBytes))
  }

  if (format === 'jpeg') {
    return decodeJpeg(source)
  }

  if (format === 'webp') {
    if (typeof navigator !== 'undefined') {
      return decodeRasterWithPhoton(source)
    }
    const decodeWebp = (await import('@jsquash/webp/decode.js')).default
    return decodeWebp(source)
  }

  if (format === 'png') {
    return decodePng(source)
  }

  return decodeRasterWithPhoton(source)
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
  const imageData = await rasterBytesToImageData(source, format).catch((error) => {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`decode:${format}: ${reason}`)
  })
  const resized = await resizeImage(imageData, {
    width: size,
    height: size,
    method: 'lanczos3',
    fitMethod: 'contain',
    premultiply: true,
    linearRGB: true,
  }).catch((error) => {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`resize:${reason}`)
  })
  const pngBytes = await encodePng(resized).catch((error) => {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`png.encode:${reason}`)
  })
  return pngBytes instanceof Uint8Array
    ? pngBytes
    : new Uint8Array(pngBytes as ArrayBuffer)
}
