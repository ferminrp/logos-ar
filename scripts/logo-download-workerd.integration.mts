import assert from 'node:assert/strict'
import { spawn, type ChildProcess } from 'node:child_process'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { after, before, describe, it } from 'node:test'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const PORT = Number.parseInt(process.env.LOGO_DOWNLOAD_TEST_PORT ?? '3198', 10)
const BASE = `http://127.0.0.1:${PORT}`

let child: ChildProcess | null = null

async function waitForServer(url: string, timeoutMs = 60_000): Promise<void> {
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

async function expectPngOk(url: string): Promise<void> {
  const res = await fetch(url)
  assert.equal(res.status, 200, `expected 200 from ${url}`)
  assert.equal(
    res.headers.get('content-type')?.split(';')[0],
    'image/png',
    `content-type for ${url}`,
  )
  const bytes = new Uint8Array(await res.arrayBuffer())
  assert.equal(bytes[0], 0x89)
  assert.equal(bytes[1], 0x50)
}

describe('logo-download API in workerd (wrangler dev)', () => {
  before(async () => {
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
    await waitForServer(
      `${BASE}/api/logo-download?domain=ripio.com&format=png&size=64`,
    )
  })

  after(() => {
    child?.kill('SIGTERM')
  })

  for (const size of [64, 128, 256, 512]) {
    it(`ripio.com WebP→PNG size=${size} (codec init regression)`, async () => {
      await expectPngOk(
        `${BASE}/api/logo-download?domain=ripio.com&format=png&size=${size}`,
      )
    })
  }

  it('naranjax.com hosted override returns PNG', async () => {
    await expectPngOk(
      `${BASE}/api/logo-download?domain=naranjax.com&format=png&size=128`,
    )
  })

  it('bbva.com.ar returns PNG (Google favicon fallback)', async () => {
    await expectPngOk(
      `${BASE}/api/logo-download?domain=bbva.com.ar&format=png&size=128`,
    )
  })

  it('subaru.com.ar returns PNG (5xx site URL → favicon fallback)', async () => {
    await expectPngOk(
      `${BASE}/api/logo-download?domain=subaru.com.ar&format=png&size=128`,
    )
  })

  it('www.telecentro.com.ar returns an image (favicon or passthrough)', async () => {
    const res = await fetch(
      `${BASE}/api/logo-download?domain=www.telecentro.com.ar&format=png&size=128`,
    )
    assert.equal(res.status, 200, 'telecentro png download')
    assert.ok(
      res.headers.get('content-type')?.startsWith('image/'),
      'image content-type',
    )
  })

  it('passthrough uses non-png Content-Disposition filename when body is jpeg', async () => {
    const res = await fetch(
      `${BASE}/api/logo-download?domain=www.telecentro.com.ar&format=png&size=512`,
    )
    assert.equal(res.status, 200)
    const contentType = res.headers.get('content-type')?.split(';')[0]
  if (contentType === 'image/jpeg') {
      const disposition = res.headers.get('content-disposition') ?? ''
      assert.match(disposition, /filename="[^"]+\.jpg"/)
      assert.doesNotMatch(disposition, /\.png"/)
    }
  })

  it('www.galicia.ar returns PNG', async () => {
    await expectPngOk(
      `${BASE}/api/logo-download?domain=www.galicia.ar&format=png&size=128`,
    )
  })

  it('mercadolibre.com.ar returns PNG', async () => {
    await expectPngOk(
      `${BASE}/api/logo-download?domain=mercadolibre.com.ar&format=png&size=256`,
    )
  })

  it('invalid domain returns 400', async () => {
    const res = await fetch(
      `${BASE}/api/logo-download?domain=not-a-real-domain.invalid&format=png`,
    )
    assert.equal(res.status, 400)
  })

  it('502 responses include a reason', async () => {
    const res = await fetch(
      `${BASE}/api/logo-download?domain=www.galicia.ar&format=png&size=9999`,
    )
    if (res.status === 502) {
      const body = (await res.json()) as { error?: string; reason?: string }
      assert.ok(body.error)
      assert.ok(body.reason)
    } else {
      assert.ok(res.ok)
    }
  })
})
