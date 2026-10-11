import { readFile, writeFile, mkdir } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getSiteUrl } from "../lib/site-url.ts"
import {
  parseSitemapXml,
  submitToIndexNow,
  urlsWithChangedLastmod,
  verifyKeyPublished,
  discoverIndexNowKey,
} from "./indexnow-shared.mts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const sitemapPath = path.resolve(__dirname, "../public/sitemap.xml")
const defaultPreviousPath = path.resolve(
  __dirname,
  "../.cache/indexnow-previous-sitemap.xml"
)

function resolvePreviousPath(): string {
  return process.env.INDEXNOW_PREVIOUS_SITEMAP_PATH ?? defaultPreviousPath
}

function resolveCurrentPath(): string {
  return process.env.INDEXNOW_CURRENT_SITEMAP_PATH ?? sitemapPath
}

async function loadSitemap(
  label: string,
  filePath: string
): Promise<Map<string, string | null> | null> {
  try {
    const xml = await readFile(filePath, "utf8")
    return parseSitemapXml(xml)
  } catch (error) {
    if (
      error &&
      typeof error === "object" &&
      "code" in error &&
      error.code === "ENOENT"
    ) {
      console.log(`IndexNow: no ${label} sitemap at ${filePath}`)
      return null
    }
    throw error
  }
}

async function fetchProductionSitemap(): Promise<string> {
  const siteUrl = getSiteUrl().replace(/\/$/, "")
  const url = `${siteUrl}/sitemap.xml`
  const response = await fetch(url)
  if (!response.ok) {
    throw new Error(`Failed to fetch ${url}: HTTP ${response.status}`)
  }
  return response.text()
}

async function main() {
  const previousPath = resolvePreviousPath()
  const currentPath = resolveCurrentPath()

  let currentXml: string
  if (process.env.INDEXNOW_FETCH_CURRENT === "1") {
    console.log("IndexNow: loading current sitemap from production ...")
    currentXml = await fetchProductionSitemap()
  } else {
    try {
      currentXml = await readFile(currentPath, "utf8")
    } catch {
      console.log(
        `IndexNow: missing current sitemap at ${currentPath}, fetching production ...`
      )
      currentXml = await fetchProductionSitemap()
    }
  }

  const current = parseSitemapXml(currentXml)
  const previous = await loadSitemap("previous", previousPath)

  if (!previous || previous.size === 0) {
    console.log(
      "IndexNow: no previous sitemap baseline; skipping submit (run indexnow:submit-all once if needed)"
    )
    await persistCurrentSitemap(previousPath, currentXml)
    return
  }

  const changed = urlsWithChangedLastmod(previous, current)
  console.log(
    `IndexNow: ${changed.length} URL(s) with new or changed lastmod (of ${current.size} total)`
  )

  if (changed.length > 0) {
    const siteUrl = getSiteUrl().replace(/\/$/, "")
    const key = await discoverIndexNowKey()
    await verifyKeyPublished(siteUrl, key)
    await submitToIndexNow(changed)
  }

  await persistCurrentSitemap(previousPath, currentXml)
}

async function persistCurrentSitemap(
  previousPath: string,
  currentXml: string
): Promise<void> {
  await mkdir(path.dirname(previousPath), { recursive: true })
  await writeFile(previousPath, currentXml, "utf8")
  console.log(`IndexNow: saved sitemap baseline to ${previousPath}`)
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exitCode = 1
})
