import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, it } from 'node:test'
import { HOME_DOCUMENT_CACHE_CONTROL } from '../lib/home-document-headers.ts'
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

  it('GET / includes Link discovery header and HTML document cache', async () => {
    const res = await fetch(`${BASE}/`, { redirect: 'follow' })
    assert.equal(res.status, 200)
    const link = res.headers.get('link') ?? ''
    assert.match(link, /api-catalog/)
    assert.match(link, /\.well-known\/api-catalog/)
    assert.match(link, /\/api\/logos/)
    const cc = res.headers.get('cache-control') ?? ''
    assert.match(cc, /must-revalidate/)
    assert.match(cc, /max-age=0/)
    assert.equal(cc, HOME_DOCUMENT_CACHE_CONTROL)
  })

  it('negotiates Markdown for prerendered pages and keeps HTML as default', async () => {
    for (const pathname of ['/', '/categorias', '/docs', '/logo/mercado-pago', '/categoria/bancos', '/guia/excel']) {
      const markdown = await fetch(`${BASE}${pathname}`, {
        headers: { Accept: 'text/markdown' },
      })
      assert.equal(markdown.status, 200, pathname)
      assert.match(markdown.headers.get('content-type') ?? '', /^text\/markdown/, pathname)
      assert.match(markdown.headers.get('vary') ?? '', /accept/i, pathname)
      // Same URL as the HTML page: it must stay indexable.
      assert.equal(markdown.headers.get('x-robots-tag'), null, pathname)
      assert.match(await markdown.text(), /^# /, pathname)

      const html = await fetch(`${BASE}${pathname}`, {
        headers: { Accept: 'text/html,application/xhtml+xml,*/*;q=0.8' },
      })
      assert.equal(html.status, 200, pathname)
      assert.match(html.headers.get('content-type') ?? '', /^text\/html/, pathname)
    }
  })

  it('serves .md twins as noindex Markdown', async () => {
    for (const pathname of ['/index.md', '/docs.md', '/logo/mercado-pago.md']) {
      const res = await fetch(`${BASE}${pathname}`)
      assert.equal(res.status, 200, pathname)
      assert.match(res.headers.get('content-type') ?? '', /^text\/markdown/, pathname)
      assert.equal(res.headers.get('x-robots-tag'), 'noindex', pathname)
    }
  })

  it('logo page exposes its own og:image, ImageObject and Markdown alternate', async () => {
    const html = await (await fetch(`${BASE}/logo/mercado-pago`)).text()
    assert.match(html, /<meta property="og:image" content="[^"]*\/logos\/mercado-pago\.png"/)
    assert.match(html, /"@type":"ImageObject"/)
    assert.match(html, /<link rel="alternate" type="text\/markdown" href="[^"]*\/logo\/mercado-pago\.md"/)
  })

  it('sitemap has per-day lastmod and logo images', async () => {
    const xml = await (await fetch(`${BASE}/sitemap.xml`)).text()
    assert.match(xml, /<lastmod>\d{4}-\d{2}-\d{2}<\/lastmod>/)
    assert.doesNotMatch(xml, /<lastmod>[^<]*T[^<]*<\/lastmod>/)
    assert.match(xml, /<image:loc>[^<]*\/logos\/mercado-pago\.png<\/image:loc>/)
  })

  it('GET /sitemap.xml has long-lived cache-control', async () => {
    const res = await fetch(`${BASE}/sitemap.xml`)
    assert.equal(res.status, 200)
    const cc = res.headers.get('cache-control') ?? ''
    assert.match(cc, /max-age=86400/)
    assert.match(cc, /s-maxage=86400/)
  })
})
