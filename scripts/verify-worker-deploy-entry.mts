import { readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { WORKER_WRAPPER_MAIN } from './build-worker-entry-wrapper.mts'

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..')
const distWranglerPath = path.join(repoRoot, 'dist/server/wrangler.json')
const deployRedirectPath = path.join(repoRoot, '.wrangler/deploy/config.json')
const wrapperPath = path.join(repoRoot, 'dist/server', WORKER_WRAPPER_MAIN)

export async function verifyWorkerDeployEntry(): Promise<void> {
  const distWrangler = JSON.parse(await readFile(distWranglerPath, 'utf8')) as {
    main?: string
  }
  if (distWrangler.main !== WORKER_WRAPPER_MAIN) {
    throw new Error(
      `${distWranglerPath} main must be ${WORKER_WRAPPER_MAIN}, got ${distWrangler.main ?? '(unset)'}`,
    )
  }

  await readFile(wrapperPath)

  let deployRedirect: { configPath?: string } | null = null
  try {
    deployRedirect = JSON.parse(await readFile(deployRedirectPath, 'utf8'))
  } catch {
    deployRedirect = null
  }

  if (deployRedirect?.configPath) {
    const resolved = path.resolve(path.dirname(deployRedirectPath), deployRedirect.configPath)
    const expected = path.resolve(distWranglerPath)
    if (resolved !== expected) {
      throw new Error(
        `.wrangler/deploy/config.json configPath resolves to ${resolved}, expected ${expected}`,
      )
    }
  }
}

async function main() {
  await verifyWorkerDeployEntry()
  console.log('Worker deploy entry OK (dist/server wrapper + deploy redirect when present)')
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isCli) {
  main().catch((error) => {
    console.error(error instanceof Error ? error.message : error)
    process.exitCode = 1
  })
}
