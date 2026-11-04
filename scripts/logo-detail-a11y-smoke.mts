import { writeFile } from "node:fs/promises"
import path from "node:path"
import type { Browser } from "playwright"

export const LOGO_DETAIL_A11Y_SLUGS = [
  "banco-galicia",
  "banco-provincia",
  "changan",
] as const

export const MIN_LOGO_CONTROL_HEIGHT_PX = 44
export const MIN_PNG_BUTTON_CONTRAST = 4.5

export type LogoDetailA11yEntry = {
  downloadPngHeight: number
  downloadSvgHeight: number
  copyMinHeight: number
  pngContrast: number
  pngContrastHover: number
}

export type LogoDetailA11yReport = {
  baseUrl: string
  thresholds: {
    minControlHeightPx: number
    minPngContrast: number
  }
  beforeReference: {
    backgroundToken: "--primary",
    pngContrast: number
    pngContrastHover?: number
  }
  afterTokens: {
    background: string
    backgroundHover: string
  }
  slugs: Record<string, Record<string, LogoDetailA11yEntry>>
}

async function measurePngButtonContrast(
  page: import("playwright").Page,
): Promise<number> {
  return page.evaluate(() => {
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

    function contrastRatio(fg: string, bg: string): number {
      const f = cssColorToRgb(fg)
      const b = cssColorToRgb(bg)
      const l1 = relativeLuminance(f.r, f.g, f.b)
      const l2 = relativeLuminance(b.r, b.g, b.b)
      const lighter = Math.max(l1, l2)
      const darker = Math.min(l1, l2)
      return (lighter + 0.05) / (darker + 0.05)
    }

    const downloadPng = Array.from(document.querySelectorAll("button")).find((b) =>
      b.textContent?.includes("Descargar PNG"),
    ) as HTMLElement | undefined
    if (!downloadPng) throw new Error("missing Descargar PNG button")
    const style = getComputedStyle(downloadPng)
    return contrastRatio(style.color, style.backgroundColor)
  })
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
    },
    beforeReference: {
      backgroundToken: "--primary",
      pngContrast: 3.51,
    },
    afterTokens: {
      background: "--logo-download-png",
      backgroundHover: "--logo-download-png-hover",
    },
    slugs: {},
  }

  for (const slug of LOGO_DETAIL_A11Y_SLUGS) {
    report.slugs[slug] = {}
    for (const viewport of [
      { name: "mobile390", width: 390, height: 844 },
      { name: "desktop1440", width: 1440, height: 900 },
    ]) {
      const page = await browser.newPage({
        viewport: { width: viewport.width, height: viewport.height },
      })
      await page.goto(`${normalizedBase}/logo/${slug}`, {
        waitUntil: "domcontentloaded",
      })
      await page.getByRole("button", { name: "Descargar PNG" }).waitFor({ timeout: 15000 })

      const metrics = await page.evaluate(() => {
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
          copyMinHeight: Math.min(
            ...copyButtons.map((b) => b.getBoundingClientRect().height),
          ),
        }
      })

      const pngButton = page.getByRole("button", { name: "Descargar PNG" })
      const pngContrast = await measurePngButtonContrast(page)
      await pngButton.hover()
      const pngContrastHover = await measurePngButtonContrast(page)
      await page.close()

      report.slugs[slug][viewport.name] = {
        ...metrics,
        pngContrast: Number(pngContrast.toFixed(2)),
        pngContrastHover: Number(pngContrastHover.toFixed(2)),
      }
    }
  }

  return report
}

export function assertLogoDetailA11y(report: LogoDetailA11yReport): void {
  const failures: string[] = []

  for (const slug of LOGO_DETAIL_A11Y_SLUGS) {
    for (const viewport of ["mobile390", "desktop1440"] as const) {
      const entry = report.slugs[slug]?.[viewport]
      if (!entry) {
        failures.push(`${slug}/${viewport}: missing metrics`)
        continue
      }
      if (entry.downloadPngHeight < MIN_LOGO_CONTROL_HEIGHT_PX) {
        failures.push(
          `${slug}/${viewport}: Descargar PNG height ${entry.downloadPngHeight}px < ${MIN_LOGO_CONTROL_HEIGHT_PX}px`,
        )
      }
      if (entry.downloadSvgHeight < MIN_LOGO_CONTROL_HEIGHT_PX) {
        failures.push(
          `${slug}/${viewport}: Descargar SVG height ${entry.downloadSvgHeight}px < ${MIN_LOGO_CONTROL_HEIGHT_PX}px`,
        )
      }
      if (entry.copyMinHeight < MIN_LOGO_CONTROL_HEIGHT_PX) {
        failures.push(
          `${slug}/${viewport}: copy control height ${entry.copyMinHeight}px < ${MIN_LOGO_CONTROL_HEIGHT_PX}px`,
        )
      }
      if (entry.pngContrast < MIN_PNG_BUTTON_CONTRAST) {
        failures.push(
          `${slug}/${viewport}: PNG contrast ${entry.pngContrast}:1 < ${MIN_PNG_BUTTON_CONTRAST}:1`,
        )
      }
      if (entry.pngContrastHover < MIN_PNG_BUTTON_CONTRAST) {
        failures.push(
          `${slug}/${viewport}: PNG hover contrast ${entry.pngContrastHover}:1 < ${MIN_PNG_BUTTON_CONTRAST}:1`,
        )
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
