import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import isotiposMetadata from '../data/isotipos/metadata.json' with { type: 'json' }
import {
  hasCatalogIsotipo,
  ISOTIPO_SLUGS,
  isotipoR2CustomMetadata,
  publicIsotipoSvgPath,
  r2ObjectKeyForIsotipo,
} from './isotipos-catalog.ts'
import { logosDatasetCatalogSlugSet } from './catalog-logo-slugs.ts'

describe('isotipos-catalog', () => {
  it('exposes dataset-backed isotipos without duplicate energía slugs', () => {
    assert.equal(isotiposMetadata.length, ISOTIPO_SLUGS.size)
    const dataset = logosDatasetCatalogSlugSet()
    for (const row of isotiposMetadata as { slug: string }[]) {
      assert.ok(dataset.has(row.slug), `slug ${row.slug} missing from logos-dataset guard`)
      assert.ok(ISOTIPO_SLUGS.has(row.slug))
    }
  })

  it('counts source_type values in metadata', () => {
    const counts = new Map<string, number>()
    for (const row of isotiposMetadata as { source_type: string }[]) {
      counts.set(row.source_type, (counts.get(row.source_type) ?? 0) + 1)
    }
    assert.equal(counts.get('official-site'), 133)
    assert.equal(counts.get('simple-icons'), 58)
    assert.equal(counts.get('wikimedia(official-sourced)'), 5)
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

  it('isotipoR2CustomMetadata includes verified_official when set', () => {
    const official = isotiposMetadata.find(
      (row) => (row as { verified_official?: boolean }).verified_official === true,
    )
    assert.ok(official)
    const meta = isotipoR2CustomMetadata(
      official as Parameters<typeof isotipoR2CustomMetadata>[0],
      '2026-01-01T00:00:00.000Z',
    )
    assert.equal(meta.source_type, official.source_type)
    assert.equal(meta.verified_official, 'true')
    assert.equal(meta.synced_at, '2026-01-01T00:00:00.000Z')

    const simple = isotiposMetadata.find((row) => row.source_type === 'simple-icons')
    assert.ok(simple)
    const without = isotipoR2CustomMetadata(
      simple as Parameters<typeof isotipoR2CustomMetadata>[0],
      '2026-01-01T00:00:00.000Z',
    )
    assert.equal(without.verified_official, undefined)
  })
})