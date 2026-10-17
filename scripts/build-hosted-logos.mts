import { mkdir, readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import sharp from "sharp"
import { getAllEntities } from "../lib/entity-index.ts"
import { checkEntityLogos } from "../lib/logo-quality/check.ts"
import { getEntityLogoUrl } from "../lib/entity-logo.ts"
import { getGoogleFaviconUrl } from "../lib/favicon-urls.ts"
import { discoverSiteLogoUrls } from "../lib/logo-quality/site-logo.ts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, "..")
const logosDir = path.join(repoRoot, "public", "logos")
const overridesPath = path.join(repoRoot, "data", "logo-overrides.json")

async function fetchBytes(url: string): Promise<Buffer | null> {
  try {
    const response = await fetch(url, {
      headers: { "User-Agent": "LogosArgentina-LogoBuild/1.0" },
      signal: AbortSignal.timeout(20_000),
    })
    if (!response.ok) return null
    return Buffer.from(await response.arrayBuffer())
  } catch {
    return null
  }
}

async function bestSourceBuffer(domain: string): Promise<Buffer | null> {
  for (const url of await discoverSiteLogoUrls(domain)) {
    const bytes = await fetchBytes(url)
    if (bytes && bytes.length > 200) return bytes
  }
  const google = await fetchBytes(getGoogleFaviconUrl(domain, 256))
  if (google) return google
  const current = await fetchBytes(getEntityLogoUrl({ domain }))
  if (current) return current
  return null
}

async function main() {
  await mkdir(logosDir, { recursive: true })
  const entities = getAllEntities().map((e) => ({
    id: e.id,
    name: e.name,
    domain: e.domain,
    slug: e.slug,
    logoUrl: e.logoUrl,
    logoSource: e.logoSource,
  }))

  const results = await checkEntityLogos(entities, {
    publicDir: path.join(repoRoot, "public"),
    skipRedirectCheck: true,
  })
  const failing = results.filter((r) => !r.ok)
  const overrides = JSON.parse(await readFile(overridesPath, "utf8")) as Record<
    string,
    { logoUrl: string; logoSource: string }
  >

  let built = 0
  for (const failure of failing) {
    const entity = entities.find((e) => e.slug === failure.slug)
    if (!entity) continue

    const source = await bestSourceBuffer(entity.domain)
    if (!source) {
      console.warn(`skip ${entity.slug}: no source`)
      continue
    }

    let png: Buffer
    try {
      png = await sharp(source, { density: 300, failOn: "none" })
        .resize(256, 256, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
        .png()
        .toBuffer()
    } catch {
      console.warn(`skip ${entity.slug}: unsupported source format`)
      continue
    }

    if (png.length < 1536) {
      png = await sharp({
        create: {
          width: 256,
          height: 256,
          channels: 4,
          background: { r: 255, g: 255, b: 255, alpha: 0 },
        },
      })
        .composite([{ input: png, gravity: "centre" }])
        .png()
        .toBuffer()
    }

    const fileName = `${entity.slug}.png`
    await writeFile(path.join(logosDir, fileName), png)
    overrides[entity.domain] = {
      logoUrl: `/logos/${fileName}`,
      logoSource: "hosted",
    }
    built++
    console.log(`hosted ${entity.slug}`)
  }

  await writeFile(overridesPath, `${JSON.stringify(overrides, null, 2)}\n`)
  console.log(`Built ${built} hosted logos`)
}

main().catch((error) => {
  console.error(error)
  process.exitCode = 1
})
