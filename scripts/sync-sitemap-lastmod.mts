/**
 * Refresh data/sitemap-lastmod.json: pages whose content fingerprint changed get
 * today's date, everything else keeps its stored `lastmod`. Runs in prebuild; commit
 * the result so dates survive across deploys (`pnpm sync:sitemap-lastmod`).
 */
import { readFile, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  computePageHashes,
  reconcileLastmod,
  type LastmodManifest,
} from "../lib/sitemap-lastmod.ts"

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..")
const manifestPath = path.join(repoRoot, "data/sitemap-lastmod.json")

async function main() {
  let previous: LastmodManifest = {}
  try {
    previous = JSON.parse(await readFile(manifestPath, "utf8")) as LastmodManifest
  } catch {
    previous = {}
  }

  const today = new Date().toISOString().slice(0, 10)
  const hashes = computePageHashes(path.join(repoRoot, "public"))
  const next = reconcileLastmod(previous, hashes, today)
  const changed = Object.keys(next).filter(
    (pagePath) => previous[pagePath]?.hash !== next[pagePath].hash,
  )
  const removed = Object.keys(previous).filter((pagePath) => !(pagePath in next))

  if (changed.length === 0 && removed.length === 0) {
    console.log(`Sitemap lastmod up to date (${Object.keys(next).length} URLs)`)
    return
  }

  await writeFile(manifestPath, `${JSON.stringify(next, null, 2)}\n`, "utf8")
  console.log(
    `Sitemap lastmod: ${changed.length} URL(s) stamped ${today}, ${removed.length} removed`,
  )
}

main().catch((error) => {
  console.error("Failed to sync sitemap lastmod:", error)
  process.exitCode = 1
})
