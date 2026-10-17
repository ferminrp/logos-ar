import { mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { chromium } from "playwright"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const outDir =
  process.env.CONTACT_SHEET_OUT ??
  path.join("/cursor/stores/self/artifacts/loguitos")
const port = Number(process.env.CONTACT_SHEET_PORT ?? "3102")
const baseUrl = `http://127.0.0.1:${port}`

async function main() {
  await mkdir(outDir, { recursive: true })
  const browser = await chromium.launch()
  const page = await browser.newPage({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 2,
  })
  await page.goto(`${baseUrl}/categoria/fintechs`, {
    waitUntil: "networkidle",
    timeout: 120_000,
  })
  const batchAnchor = page.locator('a[href="/logo/pluspagos"], a[href="/logo/mobbex"]').first()
  await batchAnchor.scrollIntoViewIfNeeded({ timeout: 60_000 })
  await page.evaluate(() => window.scrollBy(0, -120))
  await page.waitForTimeout(500)
  const outPath = path.join(outDir, "grid-mobile-batch-section.png")
  await page.screenshot({ path: outPath, fullPage: false })
  await browser.close()
  console.log("wrote", outPath)
}

main().catch((err) => {
  console.error(err)
  process.exitCode = 1
})
