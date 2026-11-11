import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const serverDir = path.join(repoRoot, 'dist/server')

export const WORKER_WRAPPER_MAIN = 'wrapper.mjs'
export const HOME_DISCOVERY_BUNDLE = 'home-discovery-bundle.mjs'

export function buildWrapperSource(): string {
  return `import astro from './entry.mjs';
import { applyHomeDiscoveryHeaders, resolveWorkerSiteUrl } from './${HOME_DISCOVERY_BUNDLE}';

export default {
  async fetch(request, env, ctx) {
    const response = await astro.fetch(request, env, ctx);
  const url = new URL(request.url);
    return applyHomeDiscoveryHeaders(response, {
      pathname: url.pathname,
      siteUrl: resolveWorkerSiteUrl(request, env),
    });
  },
};
`
}

function bundleHomeDiscovery(outfile: string): void {
  const entry = path.join(repoRoot, 'lib/worker-home-discovery-entry.ts')
  const result = spawnSync(
    'pnpm',
  ['exec', 'esbuild', entry, '--bundle', '--format=esm', '--platform=neutral', `--outfile=${outfile}`],
    { cwd: repoRoot, encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(
      `esbuild bundle failed: ${result.stderr || result.stdout || result.status}`,
    )
  }
}

export async function buildWorkerEntryWrapper(serverRoot = serverDir): Promise<void> {
  bundleHomeDiscovery(path.join(serverRoot, HOME_DISCOVERY_BUNDLE))

  await writeFile(path.join(serverRoot, WORKER_WRAPPER_MAIN), buildWrapperSource(), 'utf8')

  const wranglerPath = path.join(serverRoot, 'wrangler.json')
  const wrangler = JSON.parse(await readFile(wranglerPath, 'utf8')) as {
    main?: string
  }
  wrangler.main = WORKER_WRAPPER_MAIN
  await writeFile(wranglerPath, `${JSON.stringify(wrangler, null, 2)}\n`, 'utf8')
}

async function main() {
  await buildWorkerEntryWrapper()
  console.log(`Wrote ${path.join(serverDir, WORKER_WRAPPER_MAIN)}`)
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isCli) {
  main().catch((error) => {
    console.error('Failed to build worker entry wrapper:', error)
    process.exitCode = 1
  })
}
