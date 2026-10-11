import { readdir, readFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getSiteUrl } from "../lib/site-url.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const publicDir = path.resolve(__dirname, "../public")

const KEY_FILE_PATTERN = /^[a-f0-9]{32}\.txt$/i
const INDEXNOW_ENDPOINT = "https://api.indexnow.org/indexnow"

export type SitemapUrlEntry = {
  loc: string
  lastmod: string | null
}

export function normalizeSiteHost(siteUrl: string): string {
  return new URL(siteUrl).host
}

export async function discoverIndexNowKey(): Promise<string> {
  const files = await readdir(publicDir)
  const keyFiles = files.filter((name) => KEY_FILE_PATTERN.test(name))
  if (keyFiles.length === 0) {
    throw new Error(
      "No IndexNow key file found in public/ (expected <32-char-hex>.txt)"
    )
  }
  if (keyFiles.length > 1) {
    throw new Error(
      `Multiple IndexNow key files in public/: ${keyFiles.join(", ")}`
    )
  }
  const key = keyFiles[0].replace(/\.txt$/i, "")
  const contents = (await readFile(path.join(publicDir, keyFiles[0]), "utf8")).trim()
  if (contents !== key) {
    throw new Error(
      `IndexNow key file ${keyFiles[0]} must contain only the key (${key})`
    )
  }
  return key
}

export function getKeyLocation(siteUrl: string, key: string): string {
  const base = siteUrl.replace(/\/$/, "")
  return `${base}/${key}.txt`
}

export async function verifyKeyPublished(
  siteUrl: string,
  key: string
): Promise<void> {
  const keyLocation = getKeyLocation(siteUrl, key)
  const response = await fetch(keyLocation, {
    headers: { Accept: "text/plain" },
  })
  if (!response.ok) {
    throw new Error(
      `IndexNow key check failed: GET ${keyLocation} returned ${response.status}`
    )
  }
  const body = (await response.text()).trim()
  if (body !== key) {
    throw new Error(
      `IndexNow key mismatch at ${keyLocation}: expected key text to match file name`
    )
  }
}

export function parseSitemapXml(xml: string): Map<string, string | null> {
  const byLoc = new Map<string, string | null>()
  const urlBlocks = xml.match(/<url>[\s\S]*?<\/url>/g) ?? []
  for (const block of urlBlocks) {
    const locMatch = block.match(/<loc>([^<]*)<\/loc>/)
    if (!locMatch) continue
    const loc = locMatch[1].trim()
    const lastmodMatch = block.match(/<lastmod>([^<]*)<\/lastmod>/)
    byLoc.set(loc, lastmodMatch ? lastmodMatch[1].trim() : null)
  }
  return byLoc
}

export function urlsWithChangedLastmod(
  previous: Map<string, string | null>,
  current: Map<string, string | null>
): string[] {
  const changed: string[] = []
  for (const [loc, lastmod] of current) {
    const prev = previous.get(loc)
    if (prev === undefined || prev !== lastmod) {
      changed.push(loc)
    }
  }
  return changed
}

export async function submitToIndexNow(urlList: string[]): Promise<number> {
  if (urlList.length === 0) {
    console.log("IndexNow: no URLs to submit, skipping POST")
    return 0
  }

  const siteUrl = getSiteUrl().replace(/\/$/, "")
  const key = await discoverIndexNowKey()
  const host = normalizeSiteHost(siteUrl)
  const keyLocation = getKeyLocation(siteUrl, key)

  const response = await fetch(INDEXNOW_ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify({
      host,
      key,
      keyLocation,
      urlList,
    }),
  })

  const status = response.status
  if (status !== 200 && status !== 202) {
    const text = await response.text().catch(() => "")
    throw new Error(
      `IndexNow POST failed with ${status}${text ? `: ${text.slice(0, 500)}` : ""}`
    )
  }

  console.log(
    `IndexNow: submitted ${urlList.length} URL(s), HTTP ${status}${status === 202 ? " (Accepted)" : " (OK)"}`
  )
  return status
}
