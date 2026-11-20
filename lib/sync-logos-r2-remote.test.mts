import assert from 'node:assert/strict'
import test from 'node:test'
import {
  etagMapFromListedObjects,
  listR2ObjectEtags,
  normalizeR2ObjectEtag,
  shouldSkipLogoUpload,
} from './sync-logos-r2-remote.ts'

test('normalizeR2ObjectEtag accepts raw and quoted hex', () => {
  assert.equal(
    normalizeR2ObjectEtag('d41d8cd98f00b204e9800998ecf8427e'),
    'd41d8cd98f00b204e9800998ecf8427e',
  )
  assert.equal(
    normalizeR2ObjectEtag('"d41d8cd98f00b204e9800998ecf8427e"'),
    'd41d8cd98f00b204e9800998ecf8427e',
  )
  assert.equal(normalizeR2ObjectEtag('abc123-2'), null)
})

test('shouldSkipLogoUpload matches local MD5 to remote etag', () => {
  const md5 = 'd41d8cd98f00b204e9800998ecf8427e'
  assert.equal(shouldSkipLogoUpload(md5, md5), true)
  assert.equal(shouldSkipLogoUpload(md5, '"d41d8cd98f00b204e9800998ecf8427e"'), true)
  assert.equal(shouldSkipLogoUpload(md5, '00000000000000000000000000000000'), false)
  assert.equal(shouldSkipLogoUpload(md5, null), false)
})

test('listR2ObjectEtags paginates and builds etag map', async () => {
  let call = 0
  const fetchImpl = async (input: string | URL | Request): Promise<Response> => {
    const href =
      typeof input === 'string'
        ? input
        : input instanceof URL
          ? input.href
          : input.url
    const url = new URL(href)
    call += 1
    if (call === 1) {
      return Response.json({
        success: true,
        result: [
          {
            key: 'loguitos.app/logos/a/logo.png',
            etag: 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa',
          },
        ],
        result_info: { is_truncated: true, cursor: 'page2' },
      })
    }
    assert.equal(url.searchParams.get('cursor'), 'page2')
    return Response.json({
      success: true,
      result: [
        {
          key: 'loguitos.app/logos/b/logo.png',
          etag: 'bbbbbbbbbbbbbbbbbbbbbbbbbbbbbbbb',
        },
      ],
      result_info: { is_truncated: false },
    })
  }

  const map = await listR2ObjectEtags({
    accountId: 'acct',
    apiToken: 'token',
    bucket: 'loguitos-assets',
    fetchImpl,
  })

  assert.equal(map.size, 2)
  assert.equal(map.get('loguitos.app/logos/a/logo.png'), 'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa')
  assert.equal(etagMapFromListedObjects([]).size, 0)
})