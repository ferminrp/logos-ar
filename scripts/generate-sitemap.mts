import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getSitemapEntries } from "../lib/sitemap-entries.ts"
import { serializeSitemapXml } from "../lib/sitemap-xml.ts"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputPath = path.resolve(__dirname, "../public/sitemap.xml")

async function main() {
  const entries = getSitemapEntries()
  const xml = serializeSitemapXml(entries)
  await writeFile(outputPath, xml, "utf8")
  console.log(`Generated sitemap (${entries.length} URLs) at public/sitemap.xml`)
}

main().catch((error) => {
  console.error("Failed to generate sitemap:", error)
  process.exitCode = 1
})
