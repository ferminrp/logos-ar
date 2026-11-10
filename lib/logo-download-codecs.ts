let ready: Promise<void> | null = null

async function initLogoDownloadCodecsBundled(): Promise<void> {
  const pngWasm = (
    (await import('@jsquash/png/codec/pkg/squoosh_png_bg.wasm')) as unknown as {
      default: ArrayBuffer
    }
  ).default
  const jpegBytes = (
    (await import('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm')) as {
      default: ArrayBuffer
    }
  ).default
  const webpBytes = (
    (await import('@jsquash/webp/codec/dec/webp_dec.wasm')) as { default: ArrayBuffer }
  ).default
  const jpegWasm = new WebAssembly.Module(jpegBytes)
  const webpWasm = new WebAssembly.Module(webpBytes)
  const resizeWasm = (
    (await import('@jsquash/resize/lib/resize/pkg/squoosh_resize_bg.wasm')) as unknown as {
      default: ArrayBuffer
    }
  ).default

  const pngDecode = await import('@jsquash/png/decode.js')
  const pngEncode = await import('@jsquash/png/encode.js')
  const jpegDecode = await import('@jsquash/jpeg/decode.js')
  const webpDecode = await import('@jsquash/webp/decode.js')
  const { initResize } = await import('@jsquash/resize')

  await pngDecode.init(pngWasm)
  await pngEncode.init(pngWasm)
  await jpegDecode.init(jpegWasm)
  await webpDecode.init(webpWasm)
  await initResize(resizeWasm)

  const { initWasm } = await import('@resvg/resvg-wasm')
  const resvgWasm = (
    (await import('@resvg/resvg-wasm/index_bg.wasm')) as { default: ArrayBuffer }
  ).default
  await initWasm(resvgWasm)
}

/** Preload Wasm codecs used by `/api/logo-download` PNG conversion. */
export async function ensureLogoDownloadCodecs(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      const isNode =
        typeof process !== 'undefined' &&
        typeof process.versions === 'object' &&
        typeof process.versions.node === 'string'
      if (isNode) {
        const { initLogoDownloadCodecsFromDisk } = await import(
          './logo-download-codecs.node.ts'
        )
        await initLogoDownloadCodecsFromDisk()
        return
      }
      await initLogoDownloadCodecsBundled()
    })()
  }
  await ready
}
