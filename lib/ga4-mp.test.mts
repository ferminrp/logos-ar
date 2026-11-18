import assert from 'node:assert/strict'
import { describe, it } from 'node:test'
import { buildMcpToolCallPayload } from './ga4-mp.ts'

describe('ga4-mp', () => {
  it('buildMcpToolCallPayload shapes mcp_tool_call', () => {
    const payload = buildMcpToolCallPayload('search_logos')
    assert.equal(payload.events.length, 1)
    assert.equal(payload.events[0]?.name, 'mcp_tool_call')
    assert.equal(payload.events[0]?.params.tool_name, 'search_logos')
    assert.match(payload.client_id, /^[0-9a-f-]{36}$/i)
  })
})