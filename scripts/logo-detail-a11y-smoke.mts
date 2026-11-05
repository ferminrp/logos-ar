import { writeFile } from "node:fs/promises"
import path from "node:path"
import type { Browser, Page } from "playwright"

export const LOGO_DETAIL_A11Y_SLUGS = [
  "banco-galicia",
  "banco-provincia",
  "banco-de-la-nacion-argentina",
  "changan",
] as const

export const LOGO_DETAIL_A11Y_THEMES = ["light", "dark"] as const

export const MIN_LOGO_CONTROL_HEIGHT_PX = 44
export const MIN_PNG_BUTTON_CONTRAST = 4.5
export const MIN_SVG_BUTTON_CONTRAST = 4.5

export type LogoDetailA11yThemeMetrics = {
  downloadPngHeight: number
  downloadSvgHeight: number
  copyMinHeight: number
  pngContrast: number
  pngContrastHover: number
  svgContrast: number
  svgContrastHover: number
}

export type LogoDetailA11yEntry = Record<
  (typeof LOGO_DETAIL_A11Y_THEMES)[number],
  LogoDetailA11yThemeMetrics
>

export type LogoDetailA11yReport = {
  baseUrl: string
  thresholds: {
    minControlHeightPx: number
    minPngContrast: number
    minSvgContrast: number
  }
  beforeReference: {
    backgroundToken: string
    pngContrastLight: number
  }
  afterTokens: {
    background: string
    backgroundHover: string
    foreground: string
  }
  slugs: Record<string, Record<string, LogoDetailA11yEntry>>
}

export async function setPageColorScheme(
  page: Page,
  theme: (typeof LOGO_DETAIL_A11Y_THEMES)[number],
): Promise<void> {
  await page.emulateMedia({
    colorScheme: theme === "dark" ? "dark" : "light",
  })
  await page.evaluate((mode) => {
    const root = document.documentElement
    if (mode === "dark") {
      root.classList.add("dark")
    } else {
      root.classList.remove("dark")
    }
  }, theme)
}

async function measureButtonLabelContrast(
  page: Page,
  labelIncludes: string,
  hovered: boolean,
): Promise<number> {
  if (hovered) {
    const button = page.getByRole("button", { name: new RegExp(labelIncludes, "i") })
    await button.hover()
  }

  return page.evaluate((label) => {
    function relativeLuminance(r: number, g: number, b: number): number {
      const transform = (c: number) =>
        c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      const [rs, gs, bs] = [transform(r), transform(g), transform(b)]
      return 0.2126 * rs + 0.7152 * gs + 0.0722 * bs
    }

    function cssColorToRgb(css: string): { r: number; g: number; b: number } {
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("canvas unavailable")
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b] = ctx.getImageData(0, 0, 1, 1).data
      return { r: r / 255, g: g / 255, b: b / 255 }
    }

    function parseRgba(css: string): { r: number; g: number; b: number; a: number } {
      const canvas = document.createElement("canvas")
      canvas.width = 1
      canvas.height = 1
      const ctx = canvas.getContext("2d")
      if (!ctx) throw new Error("canvas unavailable")
      ctx.fillStyle = css
      ctx.fillRect(0, 0, 1, 1)
      const [r, g, b, a] = ctx.getImageData(0, 0, 1, 1).data
      return { r: r / 255, g: g / 255, b: b / 255, a: a / 255 }
    }

    function blend(
      top: { r: number; g: number; b: number; a: number },
      bottom: { r: number; g: number; b: number },
    ): { r: number; g: number; b: number } {
      const a = top.a
      return {
        r: top.r * a + bottom.r * (1 - a),
        g: top.g * a + bottom.g * (1 - a),
        b: top.b * a + bottom.b * (1 - a),
      }
    }

    function effectiveBackground(element: HTMLElement): { r: number; g: number; b: number } {
      const chain: HTMLElement[] = []
      let node: HTMLElement | null = element
      while (node) {
        chain.unshift(node)
        node = node.parentElement
      }

      let composite = cssColorToRgb(getComputedStyle(document.documentElement).backgroundColor)
      for (const el of chain) {
        const layer = parseRgba(getComputedStyle(el).backgroundColor)
        if (layer.a <= 0) continue
        composite = blend(layer, composite)
      }
      return composite
    }

    function contrastRatio(fg: string, bg: { r: number; g: number; b: number }): number {
      const f = cssColorToRgb(fg)
      const l1 = relativeLuminance(f.r, f.g, f.b)
      const l2 = relativeLuminance(bg.r, bg.g, bg.b)
      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      return (lighter + 0.05) / (darker + 0.05)
    }

    const button = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes(label),
    ) as HTMLElement | undefined
    if (!button) throw new Error(`missing button: ${label}`)
    const style = getComputedStyle(button)
    return contrastRatio(style.color, effectiveBackground(button))
  }, labelIncludes)
}

async function measureLayoutMetrics(page: Page): Promise<{
  downloadPngHeight: number
  downloadSvgHeight: number
  copyMinHeight: number
}> {
  return page.evaluate(() => {
    const downloadPng = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Descargar PNG"),
    ) as HTMLElement | undefined
    const downloadSvg = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Descargar SVG"),
    ) as HTMLElement | undefined
    const copyButtons = Array.from(
      document.querySelectorAll('button[aria-label^="Copiar"]'),
    ) as HTMLElement[]

    if (!downloadPng || !downloadSvg) {
      throw new Error("missing download buttons")
    }
    if (copyButtons.length === 0) {
      throw new Error("missing copy buttons")
    }

    return {
      downloadPngHeight: downloadPng.getBoundingClientRect().height,
      downloadSvgHeight: downloadSvg.getBoundingClientRect().height,
      copyMinHeight: Math.min(...copyButtons.map((b) => b.getBoundingClientRect().height)),
    }
  })
}

async function measureThemeMetrics(page: Page): Promise<LogoDetailA11yThemeMetrics> {
  const layout = await measureLayoutMetrics(page)
  const pngContrast = await measureButtonLabelContrast(page, "Descargar PNG", false)
  const pngContrastHover = await measureButtonLabelContrast(page, "Descargar PNG", true)
  const svgContrast = await measureButtonLabelContrast(page, "Descargar SVG", false)
  const svgButton = page.getByRole("button", { name: "Descargar SVG" })
  await svgButton.hover()
  const svgContrastHover = await measureButtonLabelContrast(page, "Descargar SVG", true)

  return {
    ...layout,
    pngContrast: Number(pngContrast.toFixed(2)),
    pngContrastHover: Number(pngContrastHover.toFixed(2)),
    svgContrast: Number(svgContrast.toFixed(2)),
    svgContrastHover: Number(svgContrastHover.toFixed(2)),
  }
}

export async function runLogoDetailA11ySmoke(
  browser: Browser,
  baseUrl: string,
): Promise<LogoDetailA11yReport> {
  const normalizedBase = baseUrl.replace(/\/$/, "")
  const report: LogoDetailA11yReport = {
    baseUrl: normalizedBase,
    thresholds: {
      minControlHeightPx: MIN_LOGO_CONTROL_HEIGHT_PX,
      minPngContrast: MIN_PNG_BUTTON_CONTRAST,
      minSvgContrast: MIN_SVG_BUTTON_CONTRAST,
    },
    beforeReference: {
      backgroundToken: "--primary",
      pngContrastLight: 3.51,
    },
    afterTokens: {
      background: "--logo-download-png",
      backgroundHover: "--logo-download-png-hover",
      foreground: "--logo-download-png-foreground",
    },
    slugs: {},
  }

  for (const slug of LOGO_DETAIL_A11Y_SLUGS) {
    report.slugs[slug] = {}
    for (const viewport of [
      { name: "mobile390", width: 390, height: 844 },
      { name: "desktop1440", width: 1440, height: 900 },
    ]) {
      const entry = {} as LogoDetailA11yEntry

      for (const theme of LOGO_DETAIL_A11Y_THEMES) {
        const page = await browser.newPage({
          viewport: { width: viewport.width, height: viewport.height },
        })
        await page.goto(`${normalizedBase}/logo/${slug}`, {
          waitUntil: "domcontentloaded",
        })
        await setPageColorScheme(page, theme)
        await page.getByRole("button", { name: "Descargar PNG" }).waitFor({ timeout: 15000 })
        entry[theme] = await measureThemeMetrics(page)
        await page.close()
      }

      report.slugs[slug][viewport.name] = entry
    }
  }

  return report
}

function assertThemeMetrics(
  failures: string[],
  slug: string,
  viewport: string,
  theme: (typeof LOGO_DETAIL_A11Y_THEMES)[number],
  entry: LogoDetailA11yThemeMetrics,
): void {
  const prefix = `${slug}/${viewport}/${theme}`
  if (entry.downloadPngHeight < MIN_LOGO_CONTROL_HEIGHT_PX) {
    failures.push(
      `${prefix}: Descargar PNG height ${entry.downloadPngHeight}px < ${MIN_LOGO_CONTROL_HEIGHT_PX}px`,
    )
  }
  if (entry.downloadSvgHeight < MIN_LOGO_CONTROL_HEIGHT_PX) {
    failures.push(
      `${prefix}: Descargar SVG height ${entry.downloadSvgHeight}px < ${MIN_LOGO_CONTROL_HEIGHT_PX}px`,
    )
  }
  if (entry.copyMinHeight < MIN_LOGO_CONTROL_HEIGHT_PX) {
    failures.push(
      `${prefix}: copy control height ${entry.copyMinHeight}px < ${MIN_LOGO_CONTROL_HEIGHT_PX}px`,
    )
  }
  if (entry.pngContrast < MIN_PNG_BUTTON_CONTRAST) {
    failures.push(
      `${prefix}: PNG contrast ${entry.pngContrast}:1 < ${MIN_PNG_BUTTON_CONTRAST}:1`,
    )
  }
  if (entry.pngContrastHover < MIN_PNG_BUTTON_CONTRAST) {
    failures.push(
      `${prefix}: PNG hover contrast ${entry.pngContrastHover}:1 < ${MIN_PNG_BUTTON_CONTRAST}:1`,
    )
  }
  if (entry.svgContrast < MIN_SVG_BUTTON_CONTRAST) {
    failures.push(
      `${prefix}: SVG contrast ${entry.svgContrast}:1 < ${MIN_SVG_BUTTON_CONTRAST}:1`,
    )
  }
  if (entry.svgContrastHover < MIN_SVG_BUTTON_CONTRAST) {
    failures.push(
      `${prefix}: SVG hover contrast ${entry.svgContrastHover}:1 < ${MIN_SVG_BUTTON_CONTRAST}:1`,
    )
  }
}

export function assertLogoDetailA11y(report: LogoDetailA11yReport): void {
  const failures: string[] = []

  for (const slug of LOGO_DETAIL_A11Y_SLUGS) {
    for (const viewport of ["mobile390", "desktop1440"] as const) {
      const viewportEntry = report.slugs[slug]?.[viewport]
      if (!viewportEntry) {
        failures.push(`${slug}/${viewport}: missing metrics`)
        continue
      }
      for (const theme of LOGO_DETAIL_A11Y_THEMES) {
        assertThemeMetrics(failures, slug, viewport, theme, viewportEntry[theme])
      }
    }
  }

  if (failures.length > 0) {
    throw new Error(`Logo detail a11y smoke failed:\n${failures.join("\n")}`)
  }
}

export async function runLogoDetailA11ySmokeCli(baseUrl: string): Promise<void> {
  const { chromium } = await import("playwright")
  const browser = await chromium.launch({ headless: true })
  try {
    const report = await runLogoDetailA11ySmoke(browser, baseUrl)
    assertLogoDetailA11y(report)
    console.log(JSON.stringify(report, null, 2))
  } finally {
    await browser.close()
  }
}

export async function writeLogoDetailA11yArtifact(
  report: LogoDetailA11yReport,
  outDir: string,
): Promise<string> {
  const filePath = path.join(outDir, "logo-detail-a11y.json")
  await writeFile(filePath, JSON.stringify(report, null, 2))
  return filePath
}
