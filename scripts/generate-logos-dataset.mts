import { createHash } from "node:crypto"
import { mkdir, writeFile } from "node:fs/promises"
import path from "node:path"
import { fileURLToPath } from "node:url"
import {
  categories,
  getDuckDuckGoFaviconUrl,
  getGoogleFaviconUrl,
} from "../lib/logos-data.ts"

type LogoItem = {
  name: string
  domain: string
  google_domain: string
  duck_domain: string
  categoryId: string
  categoryName: string
}

type GeneratedDataset = {
  version: string
  totalItems: number
  items: LogoItem[]
}

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const outputDir = path.resolve(__dirname, "../data")
const outputPath = path.resolve(outputDir, "logos-dataset.json")

async function main() {
  const items: LogoItem[] = categories.flatMap((category) =>
    category.entities.map((entity) => ({
      name: entity.name,
      domain: entity.domain,
      google_domain: getGoogleFaviconUrl(entity.domain),
      duck_domain: getDuckDuckGoFaviconUrl(entity.domain),
      categoryId: category.id,
      categoryName: category.name,
    })),
  )

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
    `Generated logos dataset (${dataset.totalItems} items, version ${dataset.version})`,
  )
}

main().catch((error) => {
  console.error("Failed to generate logos dataset:", error)
  process.exitCode = 1
})
