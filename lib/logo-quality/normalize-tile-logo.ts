import sharp from "sharp"

const CANVAS = 256
const MIN_CONTENT_FILL = 0.68

/**
 * Trim whitespace, scale so content fills ~60% of the square canvas, center on transparent PNG.
 */
export async function normalizeLogoForTile(source: Buffer): Promise<Buffer> {
  const trimmed = await sharp(source, { failOn: "none", density: 200 })
    .trim()
    .png()
    .toBuffer()

  const meta = await sharp(trimmed).metadata()
  const cw = meta.width ?? CANVAS
  const ch = meta.height ?? CANVAS
  const target = CANVAS * MIN_CONTENT_FILL
  const scale = Math.min(target / Math.max(cw, ch), 4)
  let nw = Math.max(1, Math.round(cw * scale))
  let nh = Math.max(1, Math.round(ch * scale))
  if (nw > CANVAS || nh > CANVAS) {
    const fit = Math.min(CANVAS / nw, CANVAS / nh)
    nw = Math.max(1, Math.round(nw * fit))
    nh = Math.max(1, Math.round(nh * fit))
  }

  const resized = await sharp(trimmed).resize(nw, nh, { fit: "fill" }).png().toBuffer()

  const left = Math.floor((CANVAS - nw) / 2)
  const top = Math.floor((CANVAS - nh) / 2)

  return sharp({
    create: {
      width: CANVAS,
      height: CANVAS,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    },
  })
    .composite([{ input: resized, left, top }])
    .png()
    .toBuffer()
}
