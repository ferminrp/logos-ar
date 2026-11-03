/**
 * Download, normalize (60% tile fill), and host logos for batch slugs.
 */
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { getAllEntities } from "../lib/entity-index.ts"
import { analyzeLogoVisual, evaluateVisualAnalysis } from "../lib/logo-quality/visual-analysis.ts"
import { normalizeLogoForTile } from "../lib/logo-quality/normalize-tile-logo.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const logosDir = path.join(repoRoot, "public", "logos")
const overridesPath = path.join(repoRoot, "data", "logo-overrides.json")

/** slug → source URL (SVG/PNG) */
const SOURCES: Record<string, string> = {
  "prevencion-salud":
    "https://corporate-site-content.gruposancorseguros.com/PS/Content/logo-ps.svg",
  "sos-salud":
    "https://sossalud.com.ar/wp-content/uploads/2024/11/sos-salud-logo.svg",
  pluspagos:
    "https://pluspagos.com/wp-content/uploads/2026/04/appicon_pluspagos-300x300.png",
  "new-balance":
    "https://www.newbalance.com.ar/on/demandware.static/Sites-NewBalance-Site/-/default/dw9751a2c3/images/logo-small.svg",
  trapiche: "https://trapiche.com.ar/img/logo-trapiche-blanco.svg",
  mobbex: "https://www.mobbex.com/images/logos/mobbex-dark.png",
  kosiuko:
    "https://www.kosiuko.com/static/version1792078230/frontend/Improntus/kosiuko/es_AR/images/iconos/logo-kosiuko-black.svg",
  awada: "https://www.awada.com.ar/images/main-logo.svg",
  "mg-motor": "https://upload.wikimedia.org/wikipedia/commons/5/5e/Mg_logo.svg",
  "natura-cosmeticos":
    "https://images.rede.natura.net/html/crm/campanha/20180528/N__LOGO_NATURA_20180528_01.png",
  renaper:
    "https://upload.wikimedia.org/wikipedia/commons/a/a6/Renaper_-_Registro_Nacional_de_las_Personas_%28logotipo%29.png",
  senasa: "https://upload.wikimedia.org/wikipedia/commons/3/31/Senasa_Logo.png",
  anmat: "https://upload.wikimedia.org/wikipedia/commons/f/f3/Logo_ANMAT.png",
  enargas: "https://www.enargas.gob.ar/img/LogoEnregeSecMono.svg",
  "hospital-italiano-de-buenos-aires":
    "https://upload.wikimedia.org/wikipedia/commons/c/c6/Hospital_Italiano_de_Buenos_Aires_logo.svg",
  megatone: "https://upload.wikimedia.org/wikipedia/commons/3/33/Megatone.svg",
  loginter:
    "https://static.wixstatic.com/media/ede86d_0ef321a1625d4208a89c748b3e556f62%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/ede86d_0ef321a1625d4208a89c748b3e556f62%7Emv2.png",
  sodimac: "https://upload.wikimedia.org/wikipedia/commons/8/82/Logotipo_Sodimac.svg",
  "prisma-medios-de-pago":
    "https://prismamediosdepago.com/sites/default/files/prisma-logo-nav.png",
  starlink: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Starlink_logo.svg",
  iveco: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Iveco_Logo_2023.svg",
  tenaris: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Tenaris_Logo.svg",
  samsung: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Samsung_wordmark.svg",
  cencosud: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Cencosud_logo.svg",
  pagos360:
    "https://www.pagos360.com/_assets/v11/eda661a8094d24e6e461b99700a8adbb9a6d3967.png",
  osecac: "https://www.osecac.org.ar/image/logo_encabezado_sss.png",
  osuthgra: "https://osuthgra.org.ar/wp-content/uploads/2025/11/icon_OSUTHGRA.png",
  medicus:
    "https://cdn.prod.website-files.com/6841ec68b99280a8ee317172/6878fa5ef7efb31404276224_BrandLogo.svg",
  "banco-entre-rios-bersa": "https://bersa.com.ar/wp-content/uploads/2024/06/Logo.svg",
  "don-satur":
    "https://www.donsatur.com.ar/wp-content/uploads/2020/11/logo-don-satur-RGB.png",
  ioio: "https://ioio.com.ar/wp-content/uploads/2023/04/logo-ioio-102.png",
}

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "LogosArgentina-Host/1.0" },
      signal: AbortSignal.timeout(25_000),
    })
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

async function main() {
  const entities = getAllEntities()
  const overrides = JSON.parse(await readFile(overridesPath, "utf8")) as Record<
    string,
    { logoUrl: string; logoSource: string }
  >

  for (const [slug, url] of Object.entries(SOURCES)) {
    const entity = entities.find((e) => e.slug === slug)
    if (!entity) {
      console.warn("skip slug (not in catalog)", slug)
      continue
    }
    const raw = await fetchBytes(url)
    if (!raw) {
      console.warn("fetch failed", slug, url)
      continue
    }
    let prepared = raw
    if (
      slug === "enargas" ||
      slug === "hospital-italiano-de-buenos-aires" ||
      slug === "natura-cosmeticos" ||
      slug === "cencosud"
    ) {
      prepared = await sharp(raw, { density: 240, failOn: "none" })
        .flatten({ background: "#ffffff" })
        .png()
        .toBuffer()
    }
    if (slug === "trapiche") {
      const burgundy = { r: 114, g: 47, b: 55 }
      const mark = await sharp(raw, { density: 220, failOn: "none" })
        .resize(360, 140, { fit: "inside" })
        .png()
        .toBuffer()
      prepared = await sharp({
        create: {
          width: 512,
          height: 512,
          channels: 3,
          background: burgundy,
        },
      })
        .composite([{ input: mark, gravity: "center" }])
        .png()
        .toBuffer()
    }
    if (slug === "mobbex") {
      prepared = await sharp(raw, { density: 200, failOn: "none" })
        .resize(420, 420, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
        .flatten({ background: "#ffffff" })
        .png()
        .toBuffer()
    }
    let png: Buffer
    try {
      png = await normalizeLogoForTile(prepared)
    } catch {
      png = await sharp(raw, { density: 200, failOn: "none" })
        .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    }
    if (png.length < 1536) {
      console.warn("too small", slug, png.length)
      continue
    }
    const analysis = await analyzeLogoVisual(new Uint8Array(png))
    const issues = analysis ? evaluateVisualAnalysis(analysis) : [{ code: "blank-or-faint" }]
    const fileName = `${slug}.png`
    await writeFile(path.join(logosDir, fileName), png)
    overrides[entity.domain.toLowerCase()] = {
      logoUrl: `/logos/${fileName}`,
      logoSource: "hosted",
    }
    if (issues.length > 0) {
      console.warn("visual warn", slug, issues.map((i) => i.message).join("; "))
    } else {
      console.log("ok", slug, png.length)
    }
  }

  await writeFile(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`)
}

main()
