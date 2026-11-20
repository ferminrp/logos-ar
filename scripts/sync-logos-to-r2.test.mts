import assert from 'node:assert/strict'
import test from 'node:test'
import {
  md5Hex,
  slugFromPublicLogoFile,
  localExtension,
} from './sync-logos-to-r2.mts'
import { r2ObjectKeyForHostedLogo } from '../lib/worker-logos-r2.ts'

test('slugFromPublicLogoFile normalizes hosted file names', () => {
  assert.equal(slugFromPublicLogoFile('mercado-pago.png'), 'mercado-pago')
  assert.equal(slugFromPublicLogoFile('Ripio.SVG'), 'ripio')
  assert.equal(slugFromPublicLogoFile('bad_slug.png'), null)
})

test('localExtension maps png and svg only', () => {
  assert.equal(localExtension('a.png'), 'png')
  assert.equal(localExtension('a.svg'), 'svg')
  assert.equal(localExtension('a.webp'), null)
})

test('md5Hex and R2 keys align with worker mapping', () => {
  const bytes = new Uint8Array([1, 2, 3])
  assert.match(md5Hex(bytes), /^[a-f0-9]{32}$/)
  assert.equal(
    r2ObjectKeyForHostedLogo('mercado-pago', 'png'),
    'loguitos.app/logos/mercado-pago/logo.png',
  )
})