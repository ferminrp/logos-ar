import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  hasCatalogIsotipo,
  ISOTIPO_SLUGS,
  publicIsotipoSvgPath,
  r2ObjectKeyForIsotipo,
} from './isotipos-catalog.ts'
import { logosDatasetHostedSlugSet } from './catalog-logo-slugs.ts'

describe('isotipos-catalog', () => {
  it('only exposes slugs present in logos-dataset hosted URLs', () => {
    const dataset = logosDatasetHostedSlugSet()
    for (const slug of ISOTIPO_SLUGS) {
      assert.ok(dataset.has(slug), `unexpected isotipo slug ${slug}`)
    }
    assert.ok(ISOTIPO_SLUGS.size > 0)
  })

  it('maps public path and R2 key', () => {
    assert.equal(
      publicIsotipoSvgPath('mercado-pago'),
      '/logos/mercado-pago/isotipo.svg',
    )
    assert.equal(
      r2ObjectKeyForIsotipo('mercado-pago'),
      'loguitos.app/logos/mercado-pago/isotipo.svg',
    )
  })

  it('mercado-pago is in the isotipo set', () => {
    assert.equal(hasCatalogIsotipo('mercado-pago'), true)
    assert.equal(hasCatalogIsotipo('not-a-real-slug'), false)
  })
})