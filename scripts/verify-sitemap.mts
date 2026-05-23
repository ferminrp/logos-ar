import { readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getSitemapEntries } from "../lib/sitemap-entries.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const sitemapPath = path.resolve(__dirname, "../public/sitemap.xml")

const MIN_EXPECTED_URLS = 150

function assertValidXml(content: string): void {
  if (!content.startsWith('<?xml version="1.0" encoding="UTF-8"?>')) {
    throw new Error("Sitemap must start with XML declaration")
  }
  if (!content.includes('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">')) {
    throw new Error("Sitemap must include urlset namespace")
  }
  if (content.includes("&") && !content.includes("&amp;")) {
    const rawAmpersandInLoc = /<loc>[^<]*&(?!amp;|lt;|gt;|quot;|apos;)[^<]*<\/loc>/.test(
      content
    )
    if (rawAmpersandInLoc) {
      throw new Error("Sitemap contains unescaped ampersands in loc values")
    }
  }
}

async function main() {
  const expectedCount = getSitemapEntries().length
  let content: string

  try {
    content = await readFile(sitemapPath, "utf8")
  } catch {
    throw new Error(`Missing sitemap file at ${sitemapPath}. Run postbuild first.`)
  }

  assertValidXml(content)

  const locCount = (content.match(/<loc>/g) ?? []).length

  if (locCount === 0) {
    throw new Error("Sitemap has no <loc> entries")
  }

  if (locCount < MIN_EXPECTED_URLS) {
    throw new Error(
      `Sitemap has only ${locCount} URLs (minimum ${MIN_EXPECTED_URLS})`
    )
  }

  if (locCount !== expectedCount) {
    throw new Error(
      `Sitemap URL count mismatch: file has ${locCount}, expected ${expectedCount}`
    )
  }

  console.log(`Sitemap OK: ${locCount} URLs at public/sitemap.xml`)
}

main().catch((error) => {
  console.error("Sitemap verification failed:", error)
  process.exitCode = 1
})
