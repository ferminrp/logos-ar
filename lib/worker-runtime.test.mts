import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  isCloudflareWorkersRuntime,
  isNodeFilesystemRuntime,
} from './worker-runtime.ts'

describe('worker-runtime', () => {
  it('detects Node filesystem in unit tests', () => {
    assert.equal(isNodeFilesystemRuntime(), true)
    assert.equal(isCloudflareWorkersRuntime(), false)
  })
})
