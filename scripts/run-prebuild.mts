import { spawn } from "node:child_process"
import path from "node:path"
import { fileURLToPath } from "node:url"

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const repoRoot = path.resolve(__dirname, "..")

/**
 * `data/logos-dataset.json` is imported by the isotipo staging step (through
 * lib/isotipos-catalog.ts), so it must be fully written before the rest start.
 */
const datasetGenerator = "scripts/generate-logos-dataset.mts"

const generators = [
  "scripts/generate-flags-dataset.mts",
  "scripts/generate-permanent-redirects.mts",
  "scripts/stage-isotipo-fallback-assets.mts",
]

function runNodeScript(relativePath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.execPath,
      ["--experimental-strip-types", path.join(repoRoot, relativePath)],
      {
        cwd: repoRoot,
        stdio: "inherit",
        env: process.env,
      },
    )
    child.on("error", reject)
    child.on("exit", (code) => {
      if (code === 0) resolve()
      else reject(new Error(`${relativePath} exited with ${code ?? "unknown"}`))
    })
  })
}

async function main() {
  await runNodeScript(datasetGenerator)
  await Promise.all(generators.map((script) => runNodeScript(script)))
  // Reads the datasets generated above, so it runs after them.
  await runNodeScript("scripts/sync-sitemap-lastmod.mts")
}

main().catch((error) => {
  console.error("prebuild failed:", error instanceof Error ? error.message : error)
  process.exitCode = 1
})
