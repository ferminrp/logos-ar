import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  getAllEntities,
  getEntityBySlug,
} from './entity-index.ts'
import { getPermanentRedirects } from './permanent-redirects.mts'

describe('entity slug consolidation redirects', () => {
  const redirects = getPermanentRedirects()
  const bySource = new Map(redirects.map((r) => [r.source, r.destination]))

  it('removes duplicate acciones slugs from the catalog', () => {
    const slugs = new Set(getAllEntities().map((e) => e.slug))
    for (const removed of [
      'bbva',
      'edenor-211',
      'metrogas-214',
      'pampa',
      'supervielle',
      'banco-patagonia-380',
      'heineken-313',
      'galicia',
      'macro',
      'ypf-161',
      'uilo-bank-ex-wilobank',
    ]) {
      assert.equal(slugs.has(removed), false, `duplicate slug still present: ${removed}`)
    }
    assert.ok(slugs.has('bbva-argentina'))
    assert.ok(slugs.has('edenor'))
    assert.ok(slugs.has('metrogas'))
    assert.ok(slugs.has('banco-galicia'))
    assert.ok(slugs.has('banco-macro'))
    assert.ok(slugs.has('ypf'))
    assert.ok(slugs.has('uala'))
    assert.ok(slugs.has('pampa-energia'))
    assert.ok(slugs.has('banco-supervielle'))
    assert.ok(slugs.has('heineken'))
  })

  it('301 logo and asset paths for retired slugs', () => {
    assert.equal(bySource.get('/logo/metrogas-214'), '/logo/metrogas')
    assert.equal(bySource.get('/logos/metrogas-214.png'), '/logos/metrogas.png')
    assert.equal(
      bySource.get('/logos/metrogas-214/isotipo.svg'),
      '/logos/metrogas/isotipo.svg',
    )
    assert.equal(bySource.get('/logo/edenor-211'), '/logo/edenor')
    assert.equal(bySource.get('/logo/galicia'), '/logo/banco-galicia')
    assert.equal(bySource.get('/logos/galicia.png'), '/logos/banco-galicia.png')
    assert.equal(bySource.get('/logo/macro'), '/logo/banco-macro')
    assert.equal(bySource.get('/logos/macro.png'), '/logos/banco-macro.png')
    assert.equal(bySource.get('/logo/ypf-161'), '/logo/ypf')
    assert.equal(bySource.get('/logos/ypf-161.png'), '/logos/ypf.png')
    assert.equal(bySource.get('/logo/uilo-bank-ex-wilobank'), '/logo/uala')
    assert.equal(bySource.get('/logos/uilo-bank-ex-wilobank.png'), '/logos/uala.png')
    assert.equal(bySource.get('/logo/bbva'), '/logo/bbva-argentina')
    assert.equal(bySource.get('/logos/bbva.png'), '/logos/bbva-argentina.png')
    assert.equal(bySource.has('/logos/bbva.svg'), false)
    assert.equal(bySource.has('/logos/metrogas-214.svg'), false)
    assert.equal(bySource.get('/logo/pampa'), '/logo/pampa-energia')
    assert.equal(bySource.get('/logo/supervielle'), '/logo/banco-supervielle')
  })

  it('axion-energy uses axionenergy.com', () => {
    const axion = getAllEntities().find((e) => e.slug === 'axion-energy')
    assert.ok(axion)
    assert.equal(axion.domain, 'axionenergy.com')
  })

  it('retired slugs still resolve via slugAliases (MCP / API)', () => {
    for (const [alias, canonical] of [
      ['bbva', 'bbva-argentina'],
      ['edenor-211', 'edenor'],
      ['metrogas-214', 'metrogas'],
      ['galicia', 'banco-galicia'],
      ['macro', 'banco-macro'],
      ['ypf-161', 'ypf'],
      ['uilo-bank-ex-wilobank', 'uala'],
      ['pampa', 'pampa-energia'],
      ['supervielle', 'banco-supervielle'],
      ['heineken-313', 'heineken'],
    ] as const) {
      const resolved = getEntityBySlug(alias)
      assert.ok(resolved, `alias ${alias}`)
      assert.equal(resolved.slug, canonical)
    }
  })

  it('heineken-313 redirects to canonical page', () => {
    assert.equal(bySource.get('/logo/heineken-313'), '/logo/heineken')
  })
})