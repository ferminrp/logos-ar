import { readFileSync } from 'node:fs'
import { createRequire } from 'node:module'

function loadWasm(relativeToPkg: string, file: string): ArrayBuffer {
  const require = createRequire(import.meta.url)
  const wasmPath = require.resolve(`${relativeToPkg}/${file}`)
  const buf = readFileSync(wasmPath)
  return buf.buffer.slice(buf.byteOffset, buf.byteOffset + buf.byteLength)
}

function wasmModule(relativeToPkg: string, file: string): WebAssembly.Module {
  return new WebAssembly.Module(loadWasm(relativeToPkg, file))
}

export async function initLogoDownloadCodecsFromDisk(): Promise<void> {
  const pngDecode = await import('@jsquash/png/decode.js')
  const pngEncode = await import('@jsquash/png/encode.js')
  const jpegDecode = await import('@jsquash/jpeg/decode.js')
  const webpDecode = await import('@jsquash/webp/decode.js')
  const { initResize } = await import('@jsquash/resize')

  await pngDecode.init(loadWasm('@jsquash/png/codec/pkg', 'squoosh_png_bg.wasm'))
  await pngEncode.init(loadWasm('@jsquash/png/codec/pkg', 'squoosh_png_bg.wasm'))
  await jpegDecode.init(wasmModule('@jsquash/jpeg/codec/dec', 'mozjpeg_dec.wasm'))
  await webpDecode.init(wasmModule('@jsquash/webp/codec/dec', 'webp_dec.wasm'))
  await initResize(loadWasm('@jsquash/resize/lib/resize/pkg', 'squoosh_resize_bg.wasm'))

  const { initWasm } = await import('@resvg/resvg-wasm')
  await initWasm(loadWasm('@resvg/resvg-wasm', 'index_bg.wasm'))
}
