import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import { countries, hasFlag } from "country-flag-icons"
import { getFlagName } from "../lib/flag-names.ts"
import { getFlagSvgUrl } from "../lib/flag-urls.ts"

type FlagItem = {
  code: string
  name: string
  svgUrl: string
  categoryId: string
  categoryName: string
}

type GeneratedDataset = {
  version: string
  totalItems: number
  items: FlagItem[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputDir = path.resolve(__dirname, "../data")
const outputPath = path.resolve(outputDir, "flags-dataset.json")

async function main() {
  const items: FlagItem[] = countries
    .filter((code) => hasFlag(code))
    .map((code) => ({
      code,
      name: getFlagName(code),
      svgUrl: getFlagSvgUrl(code),
      categoryId: "banderas",
      categoryName: "Banderas",
    }))

  const digest = createHash("sha256")
    .update(JSON.stringify(items))
    .digest("hex")
    .slice(0, 12)

  const dataset: GeneratedDataset = {
    version: digest,
    totalItems: items.length,
    items,
  }

  await mkdir(outputDir, { recursive: true })
  await writeFile(outputPath, `${JSON.stringify(dataset, null, 2)}\n`, "utf8")

  console.log(
    `Generated flags dataset (${dataset.totalItems} items, version ${dataset.version})`,
  )
}

main().catch((error) => {
  console.error("Failed to generate flags dataset:", error)
  process.exitCode = 1
})
