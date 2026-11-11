import { chromium } from "playwright"

const slug = process.argv[2] ?? "mercado-pago"
const base = process.argv[3] ?? "https://loguitos.app"
const url = `${base}/logo/${slug}`

type Probe = {
  url: string
  when: string
  atMs: number
  typeofGtag: string
  hasDataLayer: boolean
  dataLayerLen: number
  gtagSnippet: string
}

const collects: { url: string; body: string; when: string }[] = []
const probes: Probe[] = []

const browser = await chromium.launch()
const page = await browser.newPage()

async function probe(when: string): Promise<void> {
  const p = await page.evaluate(() => {
    const w = window as Window & {
      gtag?: unknown
      dataLayer?: unknown[]
    }
  const gtag = w.gtag
    return {
      typeofGtag: typeof gtag,
      hasDataLayer: Array.isArray(w.dataLayer),
      dataLayerLen: w.dataLayer?.length ?? 0,
      gtagSnippet:
        typeof gtag === "function"
          ? String(gtag).slice(0, 120)
          : String(gtag),
    }
  })
  probes.push({ url, atMs: Date.now(), ...p, when })
}

await page.route("**/*", async (route) => {
  const req = route.request()
  const u = req.url()
  if (u.includes("google-analytics.com/g/collect") || u.includes("/g/collect?")) {
    collects.push({ url: u, body: req.postData() ?? "", when: "network" })
  }
  await route.continue()
})

await page.goto(url, { waitUntil: "networkidle", timeout: 60000 })
await probe("after-goto")

const gtagAtClick = await page.evaluate(() => ({
  typeofGtag: typeof (window as Window & { gtag?: unknown }).gtag,
  ownProperty: Object.prototype.hasOwnProperty.call(window, "gtag"),
  globalThisGtag: typeof (globalThis as { gtag?: unknown }).gtag,
}))

await page.getByRole("button", { name: "Descargar PNG" }).click()
await probe("after-png-click")
await page.waitForTimeout(4000)

const pngDisabled = await page
  .getByRole("button", { name: "Descargar PNG" })
  .isDisabled()
  .catch(() => false)

if (!pngDisabled) {
  await page.getByRole("button", { name: /Descargar SVG/ }).click({ timeout: 15000 })
  await probe("after-svg-click")
  await page.waitForTimeout(3000)
}

const dataLayer = await page.evaluate(() => {
  const dl = (window as Window & { dataLayer?: unknown[] }).dataLayer ?? []
  return dl.filter(
    (row) =>
      Array.isArray(row) &&
      (row[0] === "event" || (typeof row === "object" && row && "event" in row)),
  )
})

await browser.close()

const logoCollects = collects.filter(
  (c) => c.url.includes("en=logo_download") || c.body.includes("logo_download") || c.url.includes("logo_download"),
)

console.log(
  JSON.stringify(
    {
      url,
      gtagAtClick,
      probes,
      collectTotal: collects.length,
      logoCollects,
      dataLayerEventRows: dataLayer.slice(-20),
      allCollectEn: collects.map((c) => {
        const qs = c.url.split("?")[1] ?? ""
        const en = new URLSearchParams(qs).get("en")
        return en ?? c.body.match(/en=([^&]+)/)?.[1] ?? "?"
      }),
    },
    null,
    2,
  ),
)

process.exit(logoCollects.length >= 1 ? 0 : 1)
