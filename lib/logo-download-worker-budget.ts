import type { ImageMetrics } from './logo-quality/image-metrics.ts'

/**
 * Cloudflare Workers **Free** allows **10 ms CPU** per HTTP request
 * ([Workers limits — CPU time](https://developers.cloudflare.com/workers/platform/limits/#cpu-time)).
 *
 * `/api/logo-download` decodes non-PNG rasters with @jsquash / photon / resvg in WASM,
 * then resizes and re-encodes to PNG. That work counts toward CPU time; `fetch()` wait does not.
 *
 * **Calibration (2026-11-10, repo toolchain, warmed `convertRasterToPng` jpeg→128px):**
 *
 * | Input JPEG | Pixels | avg ms (n=5) |
 * | ---------- | ------ | ------------ |
 * | 256×256    | 65,536 | 5.3          |
 * | 320×320    | 102,400| 6.4          |
 * | 384×384    | 147,456| 8.1          |
 * | 512×512    | 262,144| 10.5         |
 *
 * workerd/Workers is often slower than Node for the same WASM path (preview 1102 on a ~9Mpx
 * Subaru JPEG). We cap decoded raster work at **102,400 pixels (~320×320)** and **120 KiB**
 * when dimensions are unknown — leaving headroom under the 10 ms Free tier.
 */
export const WORKERS_FREE_CPU_MS = 10
export const WORKER_WASM_DECODE_MAX_PIXELS = 102_400
export const WORKER_WASM_DECODE_MAX_BYTES = 120_000

const WASM_RASTER_FORMATS = new Set<ImageMetrics['format']>([
  'jpeg',
  'webp',
  'gif',
])

export function requiresWasmRasterPipeline(
  metrics: ImageMetrics,
  targetPngSize: number,
): boolean {
  if (metrics.format === 'png') {
    const maxEdge = Math.max(metrics.width, metrics.height)
    return maxEdge > targetPngSize
  }
  if (metrics.format === 'svg') {
    return true
  }
  return WASM_RASTER_FORMATS.has(metrics.format)
}

export function exceedsWorkerWasmDecodeBudget(
  byteLength: number,
  metrics: ImageMetrics,
  targetPngSize: number,
): boolean {
  if (!requiresWasmRasterPipeline(metrics, targetPngSize)) {
    return false
  }

  const pixels = metrics.width * metrics.height
  if (pixels > 0) {
    return pixels > WORKER_WASM_DECODE_MAX_PIXELS
  }

  return byteLength > WORKER_WASM_DECODE_MAX_BYTES
}

export function describeWorkerWasmDecodeRisk(
  byteLength: number,
  metrics: ImageMetrics,
  targetPngSize: number,
): string | null {
  if (!exceedsWorkerWasmDecodeBudget(byteLength, metrics, targetPngSize)) {
    return null
  }

  const pixels = metrics.width * metrics.height
  if (pixels > 0) {
    return `wasm decode budget (${metrics.width}×${metrics.height}px ${metrics.format}, ${byteLength} B; cap ${WORKER_WASM_DECODE_MAX_PIXELS}px / ${WORKERS_FREE_CPU_MS} ms CPU)`
  }

  return `wasm decode budget (${metrics.format}, ${byteLength} B; cap ${WORKER_WASM_DECODE_MAX_BYTES} B / ${WORKERS_FREE_CPU_MS} ms CPU)`
}
