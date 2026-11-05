/** WCAG 2.x contrast ratio for sRGB (OKLCH and hex). */

export function parseOklch(input: string): { l: number; c: number; h: number } {
  const match = input.trim().match(/^oklch\(\s*([\d.]+)\s+([\d.]+)\s+([\d.]+)\s*\)$/i)
  if (!match) {
    throw new Error(`Not an oklch color: ${input}`)
  }
  return {
    l: Number.parseFloat(match[1]),
    c: Number.parseFloat(match[2]),
    h: Number.parseFloat(match[3]),
  }
}

export function parseHexRgb(input: string): [number, number, number] {
  const hex = input.trim().replace(/^#/, "")
  if (!/^[0-9a-f]{6}$/i.test(hex)) {
    throw new Error(`Not a 6-digit hex color: ${input}`)
  }
  return [
    Number.parseInt(hex.slice(0, 2), 16),
    Number.parseInt(hex.slice(2, 4), 16),
    Number.parseInt(hex.slice(4, 6), 16),
  ]
}

/** Encode linear sRGB (0–1) to gamma-compressed sRGB (0–1). */
function srgbEncode(linear: number): number {
  const c = Math.min(1, Math.max(0, linear))
  return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055
}

function oklchToSrgbBytes(l: number, c: number, h: number): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const l3 = l_ ** 3
  const m3 = m_ ** 3
  const s3 = s_ ** 3
  const rLin = 4.0767416621 * l3 - 3.3077115913 * m3 + 0.2309699292 * s3
  const gLin = -1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3
  const bLin = -0.0041960863 * l3 - 0.7047119964 * m3 + 1.707614701 * s3
  return [
    Math.round(srgbEncode(rLin) * 255),
    Math.round(srgbEncode(gLin) * 255),
    Math.round(srgbEncode(bLin) * 255),
  ]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatioRgb(
  foreground: [number, number, number],
  background: [number, number, number],
): number {
  const lighter = Math.max(relativeLuminance(foreground), relativeLuminance(background)) + 0.05
  const darker = Math.min(relativeLuminance(foreground), relativeLuminance(background)) + 0.05
  return lighter / darker
}

export function contrastRatioHex(foreground: string, background: string): number {
  return contrastRatioRgb(parseHexRgb(foreground), parseHexRgb(background))
}

export function contrastRatioOklch(foreground: string, background: string): number {
  const fg = parseOklch(foreground)
  const bg = parseOklch(background)
  const fgRgb = oklchToSrgbBytes(fg.l, fg.c, fg.h)
  const bgRgb = oklchToSrgbBytes(bg.l, bg.c, bg.h)
  return contrastRatioRgb(fgRgb, bgRgb)
}

export const MIN_SLOT_BORDER_CONTRAST = 3
