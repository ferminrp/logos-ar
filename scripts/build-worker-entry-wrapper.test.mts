import assert from 'node:assert/strict'
import test from 'node:test'
import { buildWrapperSource, HOME_DISCOVERY_BUNDLE } from './build-worker-entry-wrapper.mts'

test('worker wrapper uses shared home-discovery bundle', () => {
  const src = buildWrapperSource()
  assert.match(src, new RegExp(HOME_DISCOVERY_BUNDLE.replace('.', '\\.')))
  assert.match(src, /applyHomeDiscoveryHeaders/)
  assert.match(src, /resolveWorkerSiteUrl/)
})
