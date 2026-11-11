import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, it } from 'node:test'
import { SITEMAP_CACHE_CONTROL } from './generate-asset-headers.mts'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const PORT = Number.parseInt(process.env.SEO_HEADERS_TEST_PORT ?? '3196', 10)
const BASE = `http://127.0.0.1:${PORT}`
const distHeadersPath = path.join(REPO_ROOT, 'dist/client/_headers')

let child: ChildProcess | null = null

async function waitForServer(pathname: string, timeoutMs = 90_000): Promise<void> {
  const url = `${BASE}${pathname}`
  const deadline = Date.now() + timeoutMs
  let lastError = ''
  while (Date.now() < deadline) {
    try {
      const res = await fetch(url)
      if (res.ok) return
      lastError = `HTTP ${res.status}`
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error)
    }
    await new Promise((r) => setTimeout(r, 500))
  }
  throw new Error(`Timed out waiting for ${url}: ${lastError}`)
}

describe('SEO headers on clean build (wrangler dev)', () => {
  before(async () => {
    const headers = await readFile(distHeadersPath, 'utf8')
    assert.match(headers, /\/sitemap\.xml/)
    assert.match(headers, new RegExp(SITEMAP_CACHE_CONTROL.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')))

    const wranglerConfig = path.join(REPO_ROOT, 'dist/server/wrangler.json')
    child = spawn(
      'pnpm',
      [
        'exec',
        'wrangler',
        'dev',
        '--config',
        wranglerConfig,
        '--port',
        String(PORT),
        '--ip',
        '127.0.0.1',
      ],
      { cwd: REPO_ROOT, stdio: 'ignore', env: process.env },
    )
    await waitForServer('/')
  })

  after(() => {
    child?.kill('SIGTERM')
  })

  it('GET / includes Link discovery header from middleware', async () => {
    const res = await fetch(`${BASE}/`, { redirect: 'follow' })
    assert.equal(res.status, 200)
    const link = res.headers.get('link') ?? ''
    assert.match(link, /api-catalog/)
    assert.match(link, /\.well-known\/api-catalog/)
    assert.match(link, /\/api\/logos/)
  })

  it('GET /sitemap.xml has long-lived cache-control', async () => {
    const res = await fetch(`${BASE}/sitemap.xml`)
    assert.equal(res.status, 200)
    const cc = res.headers.get('cache-control') ?? ''
    assert.match(cc, /max-age=86400/)
    assert.match(cc, /s-maxage=86400/)
  })
})
