import { writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { getPermanentRedirects } from "../lib/permanent-redirects.mts"

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const outputPath = path.resolve(__dirname, "../data/permanent-redirects.json")

async function main() {
  const redirects = getPermanentRedirects()
  await writeFile(outputPath, `${JSON.stringify(redirects, null, 2)}\n`, "utf8")
  console.log(`Generated ${redirects.length} permanent redirects`)
}

main().catch((error) => {
  console.error("Failed to generate permanent redirects:", error)
  process.exitCode = 1
})
