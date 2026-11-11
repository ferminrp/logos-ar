import { spawnSync } from 'node:child_process'
import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { HOME_DOCUMENT_CACHE_CONTROL } from '../lib/home-document-headers.ts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const serverDir = path.join(repoRoot, 'dist/server')

export const WORKER_WRAPPER_MAIN = 'wrapper.mjs'

export function buildWrapperSource(): string {
  return `import astro from './entry.mjs';
import { buildHomeLinkHeader } from './home-link-header.mjs';

const HOME_CACHE = ${JSON.stringify(HOME_DOCUMENT_CACHE_CONTROL)};

export default {
  async fetch(request, env, ctx) {
    const response = await astro.fetch(request, env, ctx);
    const url = new URL(request.url);
    if (url.pathname !== '/' || !response.ok) return response;
    const headers = new Headers(response.headers);
    headers.set('Link', buildHomeLinkHeader());
    if (!headers.has('Cache-Control')) {
      headers.set('Cache-Control', HOME_CACHE);
    }
    return new Response(response.body, {
      status: response.status,
      statusText: response.statusText,
      headers,
    });
  },
};
`
}

function bundleHomeLinkHeader(outfile: string): void {
  const entry = path.join(repoRoot, 'lib/home-discovery-link.ts')
  const result = spawnSync(
    'pnpm',
    [
      'exec',
      'esbuild',
      entry,
      '--bundle',
      '--format=esm',
      '--platform=neutral',
      '--outfile=' + outfile,
    ],
    { cwd: repoRoot, encoding: 'utf8' },
  )
  if (result.status !== 0) {
    throw new Error(
      `esbuild bundle failed: ${result.stderr || result.stdout || result.status}`,
    )
  }
}

export async function buildWorkerEntryWrapper(serverRoot = serverDir): Promise<void> {
  const homeLinkBundle = path.join(serverRoot, 'home-link-header.mjs')
  bundleHomeLinkHeader(homeLinkBundle)

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
