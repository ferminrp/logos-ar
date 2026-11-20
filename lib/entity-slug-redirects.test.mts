import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { getAllEntities, getEntitySlugRedirects } from './entity-index.ts'

describe('entity slug consolidation redirects', () => {
  const redirects = getEntitySlugRedirects()
  const bySource = new Map(redirects.map((r) => [r.source, r.destination]))

  it('removes duplicate acciones slugs from the catalog', () => {
    const slugs = new Set(getAllEntities().map((e) => e.slug))
    for (const removed of [
      'bbva',
      'edenor',
      'metrogas',
      'pampa',
      'supervielle',
      'banco-patagonia-380',
      'heineken-313',
    ]) {
      assert.equal(slugs.has(removed), false, `duplicate slug still present: ${removed}`)
    }
    assert.ok(slugs.has('bbva-argentina'))
    assert.ok(slugs.has('metrogas-214'))
    assert.ok(slugs.has('pampa-energia'))
    assert.ok(slugs.has('banco-supervielle'))
    assert.ok(slugs.has('heineken'))
  })

  it('301 logo and asset paths for retired slugs', () => {
    assert.equal(bySource.get('/logo/metrogas'), '/logo/metrogas-214')
    assert.equal(bySource.get('/logos/metrogas.png'), '/logos/metrogas-214.png')
    assert.equal(
      bySource.get('/logos/metrogas/isotipo.svg'),
      '/logos/metrogas-214/isotipo.svg',
    )
    assert.equal(bySource.get('/logo/bbva'), '/logo/bbva-argentina')
    assert.equal(bySource.get('/logos/bbva.png'), '/logos/bbva-argentina.png')
    assert.equal(bySource.get('/logo/pampa'), '/logo/pampa-energia')
    assert.equal(bySource.get('/logo/supervielle'), '/logo/banco-supervielle')
  })

  it('axion-energy uses axionenergy.com', () => {
    const axion = getAllEntities().find((e) => e.slug === 'axion-energy')
    assert.ok(axion)
    assert.equal(axion.domain, 'axionenergy.com')
  })
})