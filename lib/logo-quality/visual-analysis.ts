import sharp from "sharp"

export type VisualAnalysis = {
  width: number
  height: number
  contentWidth: number
  contentHeight: number
  aspectRatio: number
  opaqueRatio: number
  /** Mean channel variance on opaque pixels (0–~65025). */
  variance: number
  uniqueColors: number
  dHash: bigint
}

const DHASH_SIZE = 8

export function hammingDistance(a: bigint, b: bigint): number {
  let x = a ^ b
  let count = 0
  while (x > 0n) {
    count += Number(x & 1n)
    x >>= 1n
  }
  return count
}

/** Difference hash (dHash) on 64-bit grayscale grid — stable across minor resize/compression. */
export async function computeDHash(bytes: Uint8Array): Promise<bigint> {
  const { data, info } = await sharp(Buffer.from(bytes), { failOn: "none" })
    .resize(DHASH_SIZE + 1, DHASH_SIZE, { fit: "fill" })
    .grayscale()
    .raw()
    .toBuffer({ resolveWithObject: true })

  let hash = 0n
  for (let y = 0; y < DHASH_SIZE; y++) {
    for (let x = 0; x < DHASH_SIZE; x++) {
      const left = data[y * (DHASH_SIZE + 1) + x]!
      const right = data[y * (DHASH_SIZE + 1) + x + 1]!
      if (left < right) {
        hash |= 1n << BigInt(y * DHASH_SIZE + x)
      }
    }
  }
  return hash
}

export async function analyzeLogoVisual(bytes: Uint8Array): Promise<VisualAnalysis | null> {
  try {
    const pipeline = sharp(Buffer.from(bytes), { failOn: "none" }).ensureAlpha()
    const meta = await pipeline.metadata()
    const width = meta.width ?? 0
    const height = meta.height ?? 0
    if (width === 0 || height === 0) return null

    const sample = await sharp(Buffer.from(bytes), { failOn: "none" })
      .ensureAlpha()
      .resize(128, 128, { fit: "inside", withoutEnlargement: false })
      .raw()
      .toBuffer({ resolveWithObject: true })

    const { data, info } = sample
    const channels = info.channels
    let opaque = 0
    let sumR = 0
    let sumG = 0
    let sumB = 0
    let sumSqR = 0
    let sumSqG = 0
    let sumSqB = 0
    const colorSet = new Set<number>()

    for (let i = 0; i < data.length; i += channels) {
      const a = channels === 4 ? data[i + 3]! / 255 : 1
      if (a < 0.12) continue
      opaque++
      const r = data[i]!
      const g = data[i + 1]!
      const b = data[i + 2]!
      sumR += r
      sumG += g
      sumB += b
      sumSqR += r * r
      sumSqG += g * g
      sumSqB += b * b
      const q = ((r >> 4) << 8) | ((g >> 4) << 4) | (b >> 4)
      colorSet.add(q)
    }

    const pixels = info.width * info.height
    const opaqueRatio = opaque / pixels
    const sampleCount = opaque * channels
    const mean = sampleCount > 0 ? (sumR + sumG + sumB) / sampleCount : 0
    const meanSq = sampleCount > 0 ? (sumSqR + sumSqG + sumSqB) / sampleCount : 0
    const variance = sampleCount > 0 ? Math.max(0, meanSq - mean * mean) : 0

    const dHash = await computeDHash(bytes)
    let aspectRatio = width / height
    let contentWidth = width
    let contentHeight = height
    try {
      const trimmed = await sharp(Buffer.from(bytes), { failOn: "none" })
        .trim()
        .toBuffer({ resolveWithObject: true })
      const tw = trimmed.info.width ?? width
      const th = trimmed.info.height ?? height
      if (tw > 0 && th > 0) {
        contentWidth = tw
        contentHeight = th
        aspectRatio = tw / th
      }
    } catch {
      // keep full-frame aspect ratio
    }

    return {
      width,
      height,
      contentWidth,
      contentHeight,
      aspectRatio,
      opaqueRatio,
      variance,
      uniqueColors: colorSet.size,
      dHash,
    }
  } catch {
    return null
  }
}

export type VisualQualityThresholds = {
  minOpaqueRatio: number
  minVariance: number
  maxAspectRatio: number
  minAspectRatio: number
  photoMinColors: number
  photoMinWideEdge: number
  maxHammingNearDuplicate: number
}

export const DEFAULT_VISUAL_THRESHOLDS: VisualQualityThresholds = {
  minOpaqueRatio: 0.08,
  minVariance: 120,
  maxAspectRatio: 2.4,
  minAspectRatio: 0.42,
  photoMinColors: 180,
  photoMinWideEdge: 220,
  maxHammingNearDuplicate: 3,
}

export type VisualIssueCode =
  | "blank-or-faint"
  | "photo-or-screenshot"
  | "near-duplicate-visual"

export function evaluateVisualAnalysis(
  analysis: VisualAnalysis,
  thresholds: VisualQualityThresholds = DEFAULT_VISUAL_THRESHOLDS,
): Array<{ code: VisualIssueCode; message: string }> {
  const issues: Array<{ code: VisualIssueCode; message: string }> = []

  const minOpaque =
    analysis.aspectRatio > 2.2 || analysis.aspectRatio < 0.45
      ? Math.min(thresholds.minOpaqueRatio, 0.03)
      : thresholds.minOpaqueRatio

  if (analysis.opaqueRatio < minOpaque) {
    issues.push({
      code: "blank-or-faint",
      message: `Logo casi vacío (${(analysis.opaqueRatio * 100).toFixed(1)}% píxeles visibles)`,
    })
  } else if (
    analysis.variance < thresholds.minVariance &&
    analysis.uniqueColors > 6
  ) {
    issues.push({
      code: "blank-or-faint",
      message: `Logo de bajo contraste (varianza ${Math.round(analysis.variance)})`,
    })
  }

  const widePhoto =
    analysis.uniqueColors >= thresholds.photoMinColors &&
    analysis.contentWidth >= thresholds.photoMinWideEdge &&
    analysis.contentHeight >= 120 &&
    (analysis.aspectRatio > thresholds.maxAspectRatio ||
      analysis.aspectRatio < thresholds.minAspectRatio)

  const bannerPhoto =
    analysis.uniqueColors >= thresholds.photoMinColors &&
    analysis.contentHeight >= 160 &&
    analysis.contentWidth >= 200 &&
    (analysis.aspectRatio > 3.2 || analysis.aspectRatio < 0.32)

  if (widePhoto || bannerPhoto) {
    issues.push({
      code: "photo-or-screenshot",
      message: `Parece foto o captura (${analysis.width}×${analysis.height}, ratio ${analysis.aspectRatio.toFixed(2)})`,
    })
  }

  return issues
}
