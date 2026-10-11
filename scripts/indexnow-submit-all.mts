import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getSiteUrl } from "../lib/site-url.ts"
import {
  discoverIndexNowKey,
  parseSitemapXml,
  submitToIndexNow,
  verifyKeyPublished,
} from "./indexnow-shared.mts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sitemapPath = path.resolve(__dirname, "../public/sitemap.xml")

async function main() {
  const siteUrl = getSiteUrl().replace(/\/$/, "")
  const key = await discoverIndexNowKey()
  console.log(`IndexNow key: ${key}`)
  console.log(`Verifying key at ${siteUrl}/${key}.txt ...`)
  await verifyKeyPublished(siteUrl, key)

  let xml: string
  try {
    xml = await readFile(sitemapPath, "utf8")
  } catch {
    throw new Error(
      `Missing ${sitemapPath}. Run pnpm build or scripts/generate-sitemap.mts first.`
    )
  }

  const entries = parseSitemapXml(xml)
  const urlList = [...entries.keys()]
  if (urlList.length === 0) {
    throw new Error("Sitemap has no URLs")
  }

  console.log(`Submitting all ${urlList.length} sitemap URL(s) in one request ...`)
  const status = await submitToIndexNow(urlList)
  if (status !== 200 && status !== 202) {
    process.exitCode = 1
  }
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
