import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import {
  exceedsWorkerWasmDecodeBudget,
  WORKER_WASM_DECODE_MAX_PIXELS,
  describeWorkerWasmDecodeRisk,
} from './logo-download-worker-budget.ts'

describe('logo-download-worker-budget', () => {
  it('subaru-sized JPEG exceeds budget', () => {
    assert.equal(
      exceedsWorkerWasmDecodeBudget(
        214_196,
        { width: 2998, height: 2998, format: 'jpeg' },
        128,
      ),
      true,
    )
    const detail = describeWorkerWasmDecodeRisk(
      214_196,
      { width: 2998, height: 2998, format: 'jpeg' },
      128,
    )
    assert.match(detail ?? '', /wasm decode budget/)
  })

  it('128×128 PNG passthrough does not exceed budget', () => {
    assert.equal(
      exceedsWorkerWasmDecodeBudget(
        2_000,
        { width: 128, height: 128, format: 'png' },
        128,
      ),
      false,
    )
  })

  it('320×320 JPEG at cap is under budget', () => {
    const edge = Math.floor(Math.sqrt(WORKER_WASM_DECODE_MAX_PIXELS))
    assert.equal(
      exceedsWorkerWasmDecodeBudget(
        30_000,
        { width: edge, height: edge, format: 'jpeg' },
        128,
      ),
      false,
    )
  })

  it('512×512 JPEG exceeds budget', () => {
    assert.equal(
      exceedsWorkerWasmDecodeBudget(
        50_000,
        { width: 512, height: 512, format: 'jpeg' },
        128,
      ),
      true,
    )
  })
})
