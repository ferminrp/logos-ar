import assert from "node:assert/strict"
import test from "node:test"
import {
  type EntityLogoInput,
  type LogoCheckResult,
  checkEntityLogo,
  checkEntityLogos,
  isTransientLogoHttpStatus,
  isTransientOnlyFailure,
} from "./check.ts"
import { defaultTransientLimit, partitionFailures } from "./gate.ts"

const GOOGLE = "https://s2.googleusercontent.com/s2/favicons?domain=x.com&sz=128"

function result(
  slug: string,
  issues: LogoCheckResult["issues"],
): LogoCheckResult {
  return { slug, name: slug, domain: `${slug}.com`, logoUrl: GOOGLE, ok: issues.length === 0, issues }
}

const transientIssue = { code: "fetch-failed" as const, message: "fetch failed", transient: true }
const realIssue = { code: "too-small-bytes" as const, message: "Logo pesa 10 B" }

function entity(slug: string, logoUrl: string): EntityLogoInput {
  return { id: 1, name: slug, domain: `${slug}.com`, slug, logoUrl }
}

function response(status: number, body = new Uint8Array(4)): Response {
  return new Response(body, { status, headers: { "content-type": "image/png" } })
}

test("isTransientLogoHttpStatus: Google favicon 404 is transient, hotlink 404 is not", () => {
  assert.equal(isTransientLogoHttpStatus(404, GOOGLE), true)
  assert.equal(isTransientLogoHttpStatus(404, "https://brand.com/logo.png"), false)
  assert.equal(isTransientLogoHttpStatus(503, "https://brand.com/logo.png"), true)
  assert.equal(isTransientLogoHttpStatus(429, "https://brand.com/logo.png"), true)
  assert.equal(isTransientLogoHttpStatus(403, GOOGLE), false)
})

test("isTransientOnlyFailure requires every issue to be transient", () => {
  assert.equal(isTransientOnlyFailure(result("a", [transientIssue])), true)
  assert.equal(isTransientOnlyFailure(result("a", [transientIssue, realIssue])), false)
  assert.equal(isTransientOnlyFailure(result("a", [])), false)
})

test("checkEntityLogo marks Google favicon 404 as transient", async () => {
  const checked = await checkEntityLogo(entity("supervielle", GOOGLE), new Map(), [], {
    skipRedirectCheck: true,
    skipFetchRetry: true,
    fetchImpl: async () => response(404),
  })
  assert.equal(checked.ok, false)
  assert.equal(checked.issues[0]?.transient, true)
})

test("checkEntityLogo treats a dead hotlinked logo (404) as a real failure", async () => {
  const checked = await checkEntityLogo(
    entity("brand", "https://brand.com/logo.png"),
    new Map(),
    [],
    { skipRedirectCheck: true, skipFetchRetry: true, fetchImpl: async () => response(404) },
  )
  assert.equal(checked.ok, false)
  assert.notEqual(checked.issues[0]?.transient, true)
})

test("checkEntityLogo marks network errors on remote logos as transient", async () => {
  const checked = await checkEntityLogo(
    entity("molino", "https://molino.com/logo.png"),
    new Map(),
    [],
    {
      skipRedirectCheck: true,
      skipFetchRetry: true,
      fetchImpl: async () => {
        throw new TypeError("fetch failed")
      },
    },
  )
  assert.equal(checked.issues[0]?.transient, true)
})

test("checkEntityLogo never treats a missing hosted file as transient", async () => {
  const checked = await checkEntityLogo(entity("hosted", "/logos/nope.png"), new Map(), [], {
    skipRedirectCheck: true,
    readFileImpl: async () => {
      throw new Error("ENOENT: no such file")
    },
  })
  assert.equal(checked.ok, false)
  assert.notEqual(checked.issues[0]?.transient, true)
})

test("checkEntityLogos re-checks transient failures once after a delay", async () => {
  let calls = 0
  const sleeps: number[] = []
  const results = await checkEntityLogos([entity("flaky", "https://flaky.com/logo.png")], {
    skipRedirectCheck: true,
    skipVisualCheck: true,
    skipFetchRetry: true,
    transientRecheckDelayMs: 1234,
    sleep: async (ms) => {
      sleeps.push(ms)
    },
    fetchImpl: async () => {
      calls++
      if (calls === 1) throw new TypeError("fetch failed")
      return response(200, new Uint8Array(4096).fill(9))
    },
  })
  assert.deepEqual(sleeps, [1234])
  assert.equal(calls, 2)
  assert.equal(results[0]?.issues.some((issue) => issue.transient), false)
})

test("checkEntityLogos skips the re-check pass when no delay is configured", async () => {
  let calls = 0
  await checkEntityLogos([entity("flaky", "https://flaky.com/logo.png")], {
    skipRedirectCheck: true,
    skipFetchRetry: true,
    fetchImpl: async () => {
      calls++
      throw new TypeError("fetch failed")
    },
  })
  assert.equal(calls, 1)
})

test("partitionFailures: full run blocks on quality issues, warns on transient ones", () => {
  const gate = partitionFailures(
    [result("ok", []), result("flaky", [transientIssue]), result("broken", [realIssue])],
    { blockingSlugs: null, total: 400 },
  )
  assert.deepEqual(gate.blocking.map((r) => r.slug), ["broken"])
  assert.deepEqual(gate.transient.map((r) => r.slug), ["flaky"])
  assert.deepEqual(gate.outOfScope, [])
})

test("partitionFailures: mixed transient + real issues still block", () => {
  const gate = partitionFailures([result("mixed", [transientIssue, realIssue])], {
    blockingSlugs: null,
    total: 400,
  })
  assert.deepEqual(gate.blocking.map((r) => r.slug), ["mixed"])
})

test("partitionFailures: too many transient failures means the checker is broken", () => {
  const many = Array.from({ length: 11 }, (_, i) => result(`s${i}`, [transientIssue]))
  const gate = partitionFailures(many, { blockingSlugs: null, total: 100 })
  assert.equal(gate.transientLimit, 10)
  assert.equal(gate.transientOverLimit, true)
  assert.equal(gate.blocking.length, 11)
  assert.equal(gate.transient.length, 0)
})

test("partitionFailures: PR scope blocks touched entities even on transient failures", () => {
  const gate = partitionFailures(
    [
      result("new-brand", [transientIssue]),
      result("untouched", [realIssue]),
    ],
    { blockingSlugs: new Set(["new-brand"]), total: 400 },
  )
  assert.deepEqual(gate.blocking.map((r) => r.slug), ["new-brand"])
  assert.deepEqual(gate.outOfScope.map((r) => r.slug), ["untouched"])
})

test("defaultTransientLimit is max(10, 5%)", () => {
  assert.equal(defaultTransientLimit(100), 10)
  assert.equal(defaultTransientLimit(400), 20)
  assert.equal(defaultTransientLimit(1000), 50)
})
