import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { filterLogosCatalogItems, queryLogosCatalog } from '../logos-catalog.ts'
import { normalizeMcpSlugQuery, queryMcpLogosCatalog } from './search-catalog.ts'

describe('search-catalog', () => {
  it('normalizeMcpSlugQuery accepts bare slug and /logo/ path', () => {
    assert.equal(normalizeMcpSlugQuery('banco-galicia'), 'banco-galicia')
    assert.equal(
      normalizeMcpSlugQuery('/logo/banco-galicia'),
      'banco-galicia',
    )
    assert.equal(
      normalizeMcpSlugQuery('https://loguitos.app/logo/banco-galicia'),
      'banco-galicia',
    )
  })

  it('MCP text search uses full catalog total, not MAX_CATALOG_LIMIT page', () => {
    const mcpSearch = queryMcpLogosCatalog({ q: 'a', limit: 50, offset: 0 })
    const apiSearch = queryLogosCatalog({ q: 'a', limit: 200, offset: 0 })
    const full = filterLogosCatalogItems({ q: 'a' })

    assert.ok(
      full.length > 200,
      `fixture should have >200 hits for "a" (got ${full.length})`,
    )
    assert.equal(apiSearch.items.length, 200, 'API page still capped at 200')
    assert.equal(mcpSearch.total, apiSearch.total)
    assert.equal(mcpSearch.hasMore, mcpSearch.total > mcpSearch.items.length)
    assert.ok(
      full.some((item) => 'code' in item),
      'broad query should include banderas in the full result set',
    )
  })

  it('slug substring match does not treat query containing a short slug as a hit', () => {
    const mcpSearch = queryMcpLogosCatalog({ q: 'fitness', limit: 50 })

    assert.ok(
      !mcpSearch.items.some(
        (item) =>
          !('code' in item) &&
          item.name.toLowerCase().includes('todo noticias'),
      ),
      '"fitness" must not match Todo Noticias via slug "tn"',
    )
  })

  it('slug in searchText lets GET /api/logos and MCP find entities by slug', () => {
    const slug = 'banco-galicia'
    const catalogOnly = queryLogosCatalog({ q: slug, limit: 10 })
    const mcpSearch = queryMcpLogosCatalog({ q: slug, limit: 10 })

    assert.ok(
      catalogOnly.items.some((item) => item.name.includes('Galicia')),
      'GET /api/logos should match hosted slug in searchText',
    )

    assert.ok(
      mcpSearch.items.some((item) =>
        item.name.toLowerCase().includes('galicia'),
      ),
      'MCP slug search should match Banco Galicia',
    )

    const hyphenBrand = queryLogosCatalog({ q: 'catena-zapata', limit: 5 })
    assert.ok(
      hyphenBrand.items.some((item) => item.name === 'Catena Zapata'),
      'hyphenated slug query should resolve Catena Zapata',
    )
  })
})