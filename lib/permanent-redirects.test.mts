import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { describe, it } from 'node:test'
import {
  getPermanentRedirects,
  permanentRedirectTargetExists,
} from './permanent-redirects.mts'

const repoRoot = path.resolve(
  path.dirname(fileURLToPath(import.meta.url)),
  '..',
)

describe('permanent redirects', () => {
  it('data/permanent-redirects.json matches filtered generator output', () => {
    const onDisk = JSON.parse(
      readFileSync(path.join(repoRoot, 'data/permanent-redirects.json'), 'utf8'),
    )
    assert.deepEqual(onDisk, getPermanentRedirects())
  })

  it('omits flat .svg redirects when canonical asset is missing', () => {
    const dropped = [
      '/logos/bbva.svg',
      '/logos/metrogas.svg',
      '/logos/banco-patagonia-380.svg',
      '/logos/tn-todo-noticias.svg',
      '/logos/banco-provincia-bs-as.svg',
      '/logos/heineken-313.svg',
    ]
    const sources = new Set(getPermanentRedirects().map((r) => r.source))
    for (const source of dropped) {
      assert.equal(sources.has(source), false, `should drop ${source}`)
    }
  })

  it('keeps png and isotipo redirects with existing targets', () => {
    assert.equal(permanentRedirectTargetExists('/logos/metrogas-214.png'), true)
    assert.equal(permanentRedirectTargetExists('/logos/metrogas-214.svg'), false)
    assert.equal(
      permanentRedirectTargetExists('/logos/metrogas-214/isotipo.svg'),
      true,
    )
  })
})