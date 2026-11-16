import { readFile, writeFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import * as esbuild from 'esbuild'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const repoRoot = path.resolve(__dirname, '..')
const serverDir = path.join(repoRoot, 'dist/server')

export const WORKER_WRAPPER_MAIN = 'wrapper.mjs'
export const HOME_DISCOVERY_BUNDLE = 'home-discovery-bundle.mjs'
export const CANONICAL_REDIRECT_BUNDLE = 'canonical-redirect-bundle.mjs'

export function buildWrapperSource(): string {
  return `import astro from './entry.mjs';
import { applyHomeDiscoveryHeaders, resolveWorkerSiteUrl } from './${HOME_DISCOVERY_BUNDLE}';
import { maybeCanonicalRedirect } from './${CANONICAL_REDIRECT_BUNDLE}';

export default {
  async fetch(request, env, ctx) {
    const redirect = maybeCanonicalRedirect(request, env);
    if (redirect) return redirect;
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

async function bundleWorkerModule(entryRelative: string, outfile: string): Promise<void> {
  const entry = path.join(repoRoot, entryRelative)
  await esbuild.build({
    entryPoints: [entry],
    bundle: true,
    format: 'esm',
    platform: 'neutral',
    outfile,
    logLevel: 'silent',
  })
}

export async function buildWorkerEntryWrapper(serverRoot = serverDir): Promise<void> {
  await bundleWorkerModule('lib/worker-home-discovery-entry.ts', path.join(serverRoot, HOME_DISCOVERY_BUNDLE))
  await bundleWorkerModule(
    'lib/worker-canonical-redirect.ts',
    path.join(serverRoot, CANONICAL_REDIRECT_BUNDLE),
  )

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
