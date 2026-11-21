import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  entityMatchesSearchQuery,
  sortBySearchRelevance,
  textMatchesSearchQuery,
} from './entity-search.ts'
import { handleLogosGet, handlePublicApiOptions } from './logos-api.ts'
import { callTool, toolCallResponse } from './mcp/tools.ts'
import { INVALID_PARAMS } from './mcp/jsonrpc.ts'
import { getGoogleFaviconUrl } from './favicon-urls.ts'

type ApiBody = {
  total: number
  knownCategories?: string[]
  items: {
    slug?: string
    pageUrl: string
    catalog_logo_url: string
  }[]
}

const deps = { siteUrl: 'https://loguitos.app' }

async function getJson(query: string) {
  const response = handleLogosGet(new Request(`https://loguitos.app/api/logos${query}`))
  return { response, body: (await response.json()) as ApiBody }
}

describe('search', () => {
  it('matches every token in any order, ignoring accents', () => {
    const bna = { name: 'Banco de la Nación Argentina', domain: 'bna.com.ar' }
    assert.equal(entityMatchesSearchQuery(bna, 'banco nacion'), true)
    assert.equal(entityMatchesSearchQuery(bna, 'nación banco'), true)
    assert.equal(entityMatchesSearchQuery(bna, 'banco galicia'), false)
    assert.equal(textMatchesSearchQuery('Perú PE', 'peru'), true)
  })

  it('puts exact and prefix name matches first', () => {
    const ranked = sortBySearchRelevance(
      [{ name: 'Banco Macro' }, { name: 'Macro Securities' }, { name: 'Macro' }],
      'macro',
    )
    assert.deepEqual(
      ranked.map((item) => item.name),
      ['Macro', 'Macro Securities', 'Banco Macro'],
    )
  })
})

describe('GET /api/logos', () => {
  it('is readable cross-origin and answers preflight', async () => {
    const { response } = await getJson('?limit=1')
    assert.equal(response.headers.get('Access-Control-Allow-Origin'), '*')
    assert.equal(handlePublicApiOptions().status, 204)
  })

  it('rejects an unknown category instead of returning the whole catalog', async () => {
    const { response, body } = await getJson('?category=nonexistent')
    assert.equal(response.status, 400)
    assert.ok(Array.isArray(body.knownCategories))
  })

  it('never answers an empty page with hasMore', async () => {
    const { body } = await getJson('?limit=0')
    assert.ok(body.items.length > 0)
  })

  it('finds multi-word queries and hides the internal search index', async () => {
    const { body } = await getJson('?q=banco%20nacion')
    assert.ok(body.total >= 1)
    const [first] = body.items
    assert.equal(first.slug, 'banco-de-la-nacion-argentina')
    assert.equal('searchText' in first, false)
    assert.match(first.pageUrl, /^https:\/\/.+\/logo\/banco-de-la-nacion-argentina$/)
    assert.match(first.catalog_logo_url, /^https:\/\//)
  })

  it('searches flags without accents', async () => {
    const { body } = await getJson('?q=espana&category=banderas')
    assert.equal(body.total, 1)
  })
})

describe('MCP tools', () => {
  it('treats inherited property names as unknown tools', () => {
    for (const name of ['constructor', 'toString', '__proto__']) {
      const result = callTool(name, {}, deps)
      assert.equal(result.ok, false)
      const response = toolCallResponse(1, result) as { error?: { code?: number } }
      assert.equal(response.error?.code, INVALID_PARAMS)
    }
  })

  it('validates search_logos arguments and paginates', () => {
    assert.equal(callTool('search_logos', { query: 123 }, deps).ok, false)
    assert.equal(
      callTool('search_logos', { query: 'a', category: 'nonexistent' }, deps).ok,
      false,
    )
    const page = callTool('search_logos', { query: '', limit: 5, offset: 5 }, deps)
    assert.equal(page.ok, true)
    assert.equal((page as { payload: { offset: number } }).payload.offset, 5)
  })

  it('get_logo falls back to name and accepts a ficha URL', () => {
    const byName = callTool('get_logo', { slug: 'nope', name: 'Brubank' }, deps)
    assert.equal((byName as { payload: { found: boolean } }).payload.found, true)
    const byUrl = callTool(
      'get_logo',
      { slug: 'https://loguitos.app/logo/brubank' },
      deps,
    )
    assert.equal((byUrl as { payload: { found: boolean } }).payload.found, true)
  })
})

describe('favicon urls', () => {
  it('never asks Google for more than 256px', () => {
    assert.match(getGoogleFaviconUrl('bna.com.ar', 512), /sz=256$/)
  })
})
