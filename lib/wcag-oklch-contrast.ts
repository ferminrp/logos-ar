/** WCAG 2.x contrast ratio for oklch() colors (sRGB, D65). */

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

function oklchToRgb(l: number, c: number, h: number): [number, number, number] {
  const hr = (h * Math.PI) / 180
  const a = c * Math.cos(hr)
  const b = c * Math.sin(hr)
  const l_ = l + 0.3963377774 * a + 0.2158037573 * b
  const m_ = l - 0.1055613458 * a - 0.0638541728 * b
  const s_ = l - 0.0894841775 * a - 1.291485548 * b
  const l3 = l_ ** 3
  const m3 = m_ ** 3
  const s3 = s_ ** 3
  const r = 255 * (4.0767416621 * l3 - 3.0821995743 * m3 + 0.2309699292 * s3)
  const g = 255 * (-1.2684380046 * l3 + 2.6097574011 * m3 - 0.3413193965 * s3)
  const b2 = 255 * (-0.0041960863 * l3 - 0.7034186147 * m3 + 1.707614701 * s3)
  const clamp = (v: number) => Math.min(255, Math.max(0, v))
  return [clamp(r), clamp(g), clamp(b2)]
}

function relativeLuminance([r, g, b]: [number, number, number]): number {
  const channel = (v: number) => {
    const s = v / 255
    return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4
  }
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b)
}

export function contrastRatioOklch(foreground: string, background: string): number {
  const fg = parseOklch(foreground)
  const bg = parseOklch(background)
  const fgRgb = oklchToRgb(fg.l, fg.c, fg.h)
  const bgRgb = oklchToRgb(bg.l, bg.c, bg.h)
  const lighter = Math.max(relativeLuminance(fgRgb), relativeLuminance(bgRgb)) + 0.05
  const darker = Math.min(relativeLuminance(fgRgb), relativeLuminance(bgRgb)) + 0.05
  return lighter / darker
}

export const MIN_SLOT_BORDER_CONTRAST = 3
