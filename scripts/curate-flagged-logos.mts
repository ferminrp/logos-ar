/**
 * Hosts curated logos for flagged entities (official site or Wikimedia).
 */
import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { getAllEntities } from "../lib/entity-index.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const logosDir = path.join(repoRoot, "public", "logos")
const overridesPath = path.join(repoRoot, "data", "logo-overrides.json")

/** slug → source URL */
const CURATED: Record<string, string> = {
  voii: "https://www.voii.com.ar/wp-content/uploads/2023/01/logo-grey.png",
  "accord-salud": "https://www.accordsalud.com.ar/iconAccordSalud.png",
  trapiche: "https://trapiche.com.ar/img/logo-trapiche-blanco.svg",
  "open-sports": "https://www.opensports.com.ar/media/logo/stores/1/logo-open.png",
  premier:
    "https://dcdn-us.mitiendanube.com/stores/224/901/themes/common/logo-2000736058-1745011612-69f8d8ae66203a5e935f72aab7aafce41745011613.png",
  ioio: "https://ioio.com.ar/wp-content/uploads/2023/04/logo-ioio-102.png",
  samsung: "https://upload.wikimedia.org/wikipedia/commons/b/b4/Samsung_wordmark.svg",
  natura: "https://natura.com.ar/sites/natura/themes/custom/agd_natura_theme/images/logo-natura.png",
  "don-satur":
    "https://www.donsatur.com.ar/wp-content/uploads/2020/11/logo-don-satur-RGB.png",
  "banco-entre-rios-bersa": "https://bersa.com.ar/wp-content/uploads/2024/06/Logo.svg",
  loginter:
    "https://static.wixstatic.com/media/ede86d_0ef321a1625d4208a89c748b3e556f62%7Emv2.png/v1/fill/w_192%2Ch_192%2Clg_1%2Cusm_0.66_1.00_0.01/ede86d_0ef321a1625d4208a89c748b3e556f62%7Emv2.png",
  starlink: "https://upload.wikimedia.org/wikipedia/commons/f/fc/Starlink_logo.svg",
  iveco: "https://upload.wikimedia.org/wikipedia/commons/f/f7/Iveco_Logo_2023.svg",
  tenaris: "https://upload.wikimedia.org/wikipedia/commons/c/cc/Tenaris_Logo.svg",
  "hospital-italiano-de-buenos-aires":
    "https://upload.wikimedia.org/wikipedia/commons/c/c6/Hospital_Italiano_de_Buenos_Aires_logo.svg",
  "openpay-argentina": "https://www.openpay.mx/openpay-logo.png",
  pagos360:
    "https://www.pagos360.com/_assets/v11/eda661a8094d24e6e461b99700a8adbb9a6d3967.png",
  renaper:
    "https://upload.wikimedia.org/wikipedia/commons/a/a6/Renaper_-_Registro_Nacional_de_las_Personas_%28logotipo%29.png",
  senasa: "https://upload.wikimedia.org/wikipedia/commons/3/31/Senasa_Logo.png",
  anmat: "https://www.anmat.gob.ar/images/anmat-logo.png",
  enargas: "https://www.enargas.gob.ar/img/LogoEnregeSecMono.svg",
  osecac: "https://www.osecac.org.ar/image/logo_encabezado_sss.png",
  osuthgra: "https://osuthgra.org.ar/wp-content/uploads/2025/11/icon_OSUTHGRA.png",
  "la-martina":
    "https://lamartina.com/cdn/shop/files/logo-black.svg?v=1774259890&width=600",
  cencosud: "https://upload.wikimedia.org/wikipedia/commons/d/dc/Cencosud_logo.svg",
  medicus:
    "https://cdn.prod.website-files.com/6841ec68b99280a8ee317172/6878fa5ef7efb31404276224_BrandLogo.svg",
  sodimac: "https://upload.wikimedia.org/wikipedia/commons/8/82/Logotipo_Sodimac.svg",
  "prisma-medios-de-pago":
    "https://prismamediosdepago.com/sites/default/files/prisma-logo-nav.png",
  megatone: "https://upload.wikimedia.org/wikipedia/commons/3/33/Megatone.svg",
  prune: "https://www.prune.com.ar/media/logo/prune-logo.svg",
}

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const clean = url.split("?")[0]!
    const response = await fetch(url, {
      headers: { "User-Agent": "LogosArgentina-Curate/1.0" },
      signal: AbortSignal.timeout(25_000),
    })
    if (!response.ok) return null
    const buf = Buffer.from(await response.arrayBuffer())
    if (buf.length < 200) return null
    return buf
  } catch {
    return null
  }
}

async function toHostedPng(source: Buffer, outPath: string): Promise<number> {
  const png = await sharp(source, {
    density: 200,
    limitInputPixels: 33_554_432,
    failOn: "none",
  })
    .resize(256, 256, {
      fit: "contain",
      background: { r: 0, g: 0, b: 0, alpha: 0 },
    })
    .png()
    .toBuffer()
  if (png.length < 1536) {
    throw new Error(`hosted PNG too small: ${png.length} B`)
  }
  await writeFile(outPath, png)
  return png.length
}

async function main() {
  await mkdir(logosDir, { recursive: true })
  const entities = getAllEntities()
  const overrides = JSON.parse(await readFile(overridesPath, "utf8")) as Record<
    string,
    { logoUrl: string; logoSource: string }
  >

  for (const [slug, url] of Object.entries(CURATED)) {
    const entity = entities.find((e) => e.slug === slug)
    if (!entity) {
      console.warn("skip unknown slug", slug)
      continue
    }
    const raw = await fetchBytes(url)
    if (!raw) {
      console.warn("fetch failed", slug, url)
      continue
    }
    const fileName = `${slug}.png`
    try {
      const bytes = await toHostedPng(raw, path.join(logosDir, fileName))
      overrides[entity.domain.toLowerCase()] = {
        logoUrl: `/logos/${fileName}`,
        logoSource: "hosted",
      }
      console.log("hosted", slug, bytes, "B")
    } catch (error) {
      console.warn("convert failed", slug, error)
    }
  }

  await writeFile(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`)
}

main()
