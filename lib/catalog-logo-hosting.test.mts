import assert from 'node:assert/strict'
import test from 'node:test'
import {
  isAllowedRemoteCatalogLogoUrl,
  isSelfHostedCatalogLogoUrl,
  listThirdPartyCatalogLogos,
} from './catalog-logo-hosting.ts'
import { getAllEntities } from './entity-index.ts'
import { getGoogleFaviconUrl } from './favicon-urls.ts'

test('self-hosted and favicon proxies are allowed catalog logo URLs', () => {
  assert.equal(isSelfHostedCatalogLogoUrl('/logos/foo.png'), true)
  assert.equal(isAllowedRemoteCatalogLogoUrl(getGoogleFaviconUrl('example.com')), true)
  assert.equal(isAllowedRemoteCatalogLogoUrl('https://www.santander.com.ar/logo.png'), false)
})

test('catalog has no disallowed third-party logo hosts', () => {
  assert.deepEqual(listThirdPartyCatalogLogos(getAllEntities()), [])
})
