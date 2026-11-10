import { describe, expect, it } from 'vitest'
import {
  isCloudflareWorkersRuntime,
  isNodeFilesystemRuntime,
} from '../lib/worker-runtime.ts'

describe('worker-runtime in workerd', () => {
  it('uses Workers UA (not Node fs codec path)', () => {
    expect(isCloudflareWorkersRuntime()).toBe(true)
    expect(isNodeFilesystemRuntime()).toBe(false)
    expect(navigator.userAgent).toBe('Cloudflare-Workers')
  })
})
