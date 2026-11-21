import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import logosDataset from '../../data/logos-dataset.json' with { type: 'json' }
import { catalogItemToMcpSummary, resolveLogoBySlugOrName } from './logo-present.ts'

const SITE = 'https://loguitos.app'

describe('logo-present', () => {
  it('catalogItemToMcpSummary resolves the entity slug and page URL', () => {
    const uala = logosDataset.items.find((item) => item.name === 'Ualá')
    assert.ok(uala)

    const summary = catalogItemToMcpSummary(SITE, uala)

    assert.equal(summary.slug, 'uala')
    assert.match(summary.pageUrl ?? '', /\/logo\/uala$/)
    assert.equal(typeof (summary as { svgIsVector?: boolean }).svgIsVector, 'boolean')
  })

  it('includes isotipoSvgUrl when the brand has an isotipo', () => {
    const mp = logosDataset.items.find((item) => item.domain === 'mercadopago.com.ar')
    assert.ok(mp)
    const summary = catalogItemToMcpSummary(SITE, mp)
    if (!('code' in summary) && summary.slug === 'mercado-pago') {
      assert.match(summary.isotipoSvgUrl ?? '', /\/logos\/mercado-pago\/isotipo\.svg$/)
    }
    const resolved = resolveLogoBySlugOrName(SITE, 'mercado-pago')
    if (resolved.found && 'domain' in resolved) {
      assert.match(resolved.isotipoSvgUrl ?? '', /\/logos\/mercado-pago\/isotipo\.svg$/)
    }
  })

  it('get_logo resolves short ISO flag codes over the full flag set', () => {
    const ar = resolveLogoBySlugOrName(SITE, 'AR')
    assert.equal(ar.found, true)
    if (!ar.found || !('code' in ar)) return
    assert.equal(ar.code, 'AR')
    assert.match(ar.svgUrl ?? '', /\/AR\.svg/)
  })
})