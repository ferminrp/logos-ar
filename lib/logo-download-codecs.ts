import { isNodeFilesystemRuntime } from './worker-runtime.ts'

let ready: Promise<void> | null = null

type WasmBinding = WebAssembly.Module | ArrayBuffer

function isWasmModule(value: unknown): value is WebAssembly.Module {
  return (
    value instanceof WebAssembly.Module ||
    Object.prototype.toString.call(value) === '[object WebAssembly.Module]'
  )
}

type JsquashInit = (
  moduleOrOptions?: WebAssembly.Module | Record<string, unknown>,
  moduleOptionOverrides?: Record<string, unknown>,
) => Promise<void>

function initJsquashWithWasmModule(
  initFn: JsquashInit,
  wasm: WebAssembly.Module,
): Promise<void> {
  return initFn({
    instantiateWasm(
      imports: WebAssembly.Imports,
      callback: (instance: WebAssembly.Instance) => void,
    ) {
      const instance = new WebAssembly.Instance(wasm, imports)
      callback(instance)
      return instance.exports
    },
  })
}

function wasmBindingLabel(imported: unknown): string {
  return Object.prototype.toString.call(imported)
}

/** Wrangler attaches wasm as `WebAssembly.Module`; Node unit tests compile from bytes. */
async function prepareJsquashWasmModule(imported: WasmBinding): Promise<WebAssembly.Module> {
  if (isWasmModule(imported)) {
    return imported
  }
  if (typeof navigator !== 'undefined') {
    throw new Error(
      `worker wasm import must be a precompiled WebAssembly.Module (got ${wasmBindingLabel(imported)})`,
    )
  }
  return new WebAssembly.Module(imported)
}

async function initStep<T>(label: string, fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    const reason = error instanceof Error ? error.message : String(error)
    throw new Error(`${label}: ${reason}`)
  }
}

async function initLogoDownloadCodecsBundled(): Promise<void> {
  const pngWasm = (
    (await import('@jsquash/png/codec/pkg/squoosh_png_bg.wasm')) as unknown as {
      default: WasmBinding
    }
  ).default
  const jpegImport = (
    (await import('@jsquash/jpeg/codec/dec/mozjpeg_dec.wasm')) as {
      default: WasmBinding
    }
  ).default
  const webpImport = (
    (await import('@jsquash/webp/codec/dec/webp_dec.wasm')) as { default: WasmBinding }
  ).default
  const jpegWasm = await prepareJsquashWasmModule(jpegImport)
  const webpWasm = await prepareJsquashWasmModule(webpImport)
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

  await initStep('png.decode', () => pngDecode.init(pngWasm))
  await initStep('png.encode', () => pngEncode.init(pngWasm))
  await initStep('jpeg', () => initJsquashWithWasmModule(jpegDecode.init, jpegWasm))
  await initStep('webp', () => initJsquashWithWasmModule(webpDecode.init, webpWasm))
  await initStep('resize', () => initResize(resizeWasm))

  const { initWasm } = await import('@resvg/resvg-wasm')
  const resvgWasm = (
    (await import('@resvg/resvg-wasm/index_bg.wasm')) as { default: ArrayBuffer }
  ).default
  await initStep('resvg', () => initWasm(resvgWasm))
}

/** Preload Wasm codecs used by `/api/logo-download` PNG conversion. */
export async function ensureLogoDownloadCodecs(): Promise<void> {
  if (!ready) {
    ready = (async () => {
      if (isNodeFilesystemRuntime()) {
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
