import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { queryLogosCatalog } from './logos-catalog.ts'

describe('queryLogosCatalog isotipoSvgUrl', () => {
  it('adds isotipoSvgUrl only for brands with an isotipo', () => {
    const mp = queryLogosCatalog({ domain: 'mercadopago.com.ar', limit: 5 })
    const row = mp.items.find(
      (item) => 'domain' in item && item.domain === 'mercadopago.com.ar',
    )
    assert.ok(row && 'domain' in row)
    if (row.isotipoSvgUrl) {
      assert.equal(row.isotipoSvgUrl, '/logos/mercado-pago/isotipo.svg')
    }

    const other = queryLogosCatalog({ domain: 'bbva.com.ar', limit: 1 })
    const bbva = other.items[0]
    assert.ok(bbva && 'domain' in bbva)
    assert.equal(bbva.isotipoSvgUrl, undefined)
  })
})