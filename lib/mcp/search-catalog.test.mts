import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { queryLogosCatalog } from '../logos-catalog.ts'
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

  it('slug search finds entity in MCP without changing GET /api/logos', () => {
    const slug = 'banco-galicia'
    const catalogOnly = queryLogosCatalog({ q: slug, limit: 10 })
    const mcpSearch = queryMcpLogosCatalog({ q: slug, limit: 10 })

    assert.equal(
      catalogOnly.items.some((item) => item.name.includes('Galicia')),
      false,
      'plain catalog search by slug alone should not match (API unchanged)',
    )

    assert.ok(
      mcpSearch.items.some((item) =>
        item.name.toLowerCase().includes('galicia'),
      ),
      'MCP slug search should match Banco Galicia',
    )
  })
})