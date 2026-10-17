import sharp from "sharp"

export type VisualAnalysis = {
  width: number
  height: number
  contentWidth: number
  contentHeight: number
  aspectRatio: number
  opaqueRatio: number
  /** Trimmed bounding box area / full image area (0–1). */
  contentFillRatio: number
  /** Max channel spread (max-min) averaged on opaque pixels. */
  contrastSpread: number
  /** Mean channel variance on opaque pixels (0–~65025). */
  variance: number
  uniqueColors: number
  /** Average (R+G+B)/3 on opaque pixels (0–255). */
  meanLuminance: number
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
    const meanLuminance =
      opaque > 0 ? (sumR + sumG + sumB) / (opaque * 3) : 0
    const sampleCount = opaque * channels
    const mean = sampleCount > 0 ? (sumR + sumG + sumB) / sampleCount : 0
    const meanSq = sampleCount > 0 ? (sumSqR + sumSqG + sumSqB) / sampleCount : 0
    const variance = sampleCount > 0 ? Math.max(0, meanSq - mean * mean) : 0

    const dHash = await computeDHash(bytes)
    let aspectRatio = width / height
    let contentWidth = width
    let contentHeight = height
    let contrastSpread = 0
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
      const tStats = await sharp(trimmed.data, {
        failOn: "none",
        raw: {
          width: tw,
          height: th,
          channels: trimmed.info.channels as sharp.Channels,
        },
      })
        .ensureAlpha()
        .stats()
      const spreads = tStats.channels.slice(0, 3).map((c) => c.max - c.min)
      contrastSpread = spreads.reduce((a, b) => a + b, 0) / spreads.length
    } catch {
      // keep full-frame aspect ratio
    }

    const contentFillRatio =
      width > 0 && height > 0 ? (contentWidth * contentHeight) / (width * height) : 0

    return {
      width,
      height,
      contentWidth,
      contentHeight,
      aspectRatio,
      opaqueRatio,
      contentFillRatio,
      contrastSpread,
      variance,
      uniqueColors: colorSet.size,
      meanLuminance,
      dHash,
    }
  } catch {
    return null
  }
}

export type VisualQualityThresholds = {
  minOpaqueRatio: number
  minContentFillRatio: number
  minContrastSpread: number
  minVariance: number
  maxAspectRatio: number
  minAspectRatio: number
  photoMinColors: number
  photoMinWideEdge: number
  maxHammingNearDuplicate: number
}

export const DEFAULT_VISUAL_THRESHOLDS: VisualQualityThresholds = {
  minOpaqueRatio: 0.12,
  minContentFillRatio: 0.2,
  minContrastSpread: 18,
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

  const maxDimRatio = Math.max(
    analysis.contentWidth / analysis.width,
    analysis.contentHeight / analysis.height,
  )
  const minDimRatio = Math.min(
    analysis.contentWidth / analysis.width,
    analysis.contentHeight / analysis.height,
  )

  const wideMark = analysis.aspectRatio > 2.1 || analysis.aspectRatio < 0.48

  if (!wideMark && analysis.contentFillRatio < thresholds.minContentFillRatio) {
    issues.push({
      code: "blank-or-faint",
      message: `Contenido recortado ocupa ${(analysis.contentFillRatio * 100).toFixed(1)}% del área del lienzo (mín. ${(thresholds.minContentFillRatio * 100).toFixed(0)}%)`,
    })
  } else if (wideMark && minDimRatio < 0.07) {
    issues.push({
      code: "blank-or-faint",
      message: `Logo demasiado bajo o angosto (${(minDimRatio * 100).toFixed(1)}% del lado corto)`,
    })
  } else if (maxDimRatio < thresholds.minContentFillRatio) {
    issues.push({
      code: "blank-or-faint",
      message: `Logo demasiado chico en el lienzo (${(maxDimRatio * 100).toFixed(1)}% del lado largo)`,
    })
  } else if (analysis.opaqueRatio < minOpaque) {
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

/** Detect logos that disappear on a white UI background (e.g. white wordmarks). */
export function evaluateInvisibleOnLightBackground(
  analysis: VisualAnalysis,
  thresholds: VisualQualityThresholds = DEFAULT_VISUAL_THRESHOLDS,
  original?: VisualAnalysis,
): Array<{ code: VisualIssueCode; message: string }> {
  const issues: Array<{ code: VisualIssueCode; message: string }> = []
  if (original && hammingDistance(original.dHash, analysis.dHash) > 4) {
    return issues
  }
  if (
    analysis.opaqueRatio > 0.9 &&
    analysis.uniqueColors <= 3 &&
    analysis.meanLuminance > 248
  ) {
    issues.push({
      code: "blank-or-faint",
      message: `Logo blanco o casi blanco sobre fondo claro (luminancia ${analysis.meanLuminance.toFixed(0)})`,
    })
  } else if (
    analysis.contrastSpread < thresholds.minContrastSpread &&
    analysis.variance < thresholds.minVariance
  ) {
    issues.push({
      code: "blank-or-faint",
      message: `Logo casi uniforme o invisible (contraste ${analysis.contrastSpread.toFixed(0)}, varianza ${Math.round(analysis.variance)})`,
    })
  }

  return issues
}

