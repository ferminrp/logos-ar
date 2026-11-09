import assert from "node:assert/strict"
import test from "node:test"
import type { LogoCheckResult } from "./check.ts"
import { checkEntityLogos } from "./check.ts"
import {
  isAvailabilityOnlyFailure,
  isLikelyNetworkOutage,
  partitionFailures,
  renderUnavailableIssueBody,
} from "./classify.ts"

function result(
  slug: string,
  logoUrl: string,
  codes: LogoCheckResult["issues"][number]["code"][],
): LogoCheckResult {
  return {
    slug,
    name: slug,
    domain: `${slug}.example`,
    logoUrl,
    ok: codes.length === 0,
    issues: codes.map((code) => ({ code, message: `${code} en ${logoUrl}` })),
  }
}

const GOOGLE_404 = result(
  "adecoagro",
  "https://s2.googleusercontent.com/s2/favicons?domain=www.adecoagro.com&sz=128",
  ["fetch-failed"],
)
const SITE_DOWN = result("molino-canuelas", "https://molinocanuelas.com/logo.png", [
  "fetch-failed",
])
const HOSTED_MISSING = result("naranja-x", "/logos/naranja-x.png", ["fetch-failed"])
const TOO_SMALL = result("tiny", "https://tiny.example/favicon.ico", ["too-small-dimensions"])
const MIXED = result("mixed", "https://mixed.example/logo.png", [
  "redirect-mismatch",
  "fetch-failed",
])
const OK = result("ok", "https://ok.example/logo.png", [])

test("isAvailabilityOnlyFailure: external fetch errors are availability-only", () => {
  assert.equal(isAvailabilityOnlyFailure(GOOGLE_404), true)
  assert.equal(isAvailabilityOnlyFailure(SITE_DOWN), true)
  assert.equal(
    isAvailabilityOnlyFailure(result("x", "https://x.example/a.png", ["site-unreachable"])),
    true,
  )
})

test("isAvailabilityOnlyFailure: hosted, quality and mixed failures are real", () => {
  assert.equal(isAvailabilityOnlyFailure(HOSTED_MISSING), false)
  assert.equal(isAvailabilityOnlyFailure(TOO_SMALL), false)
  assert.equal(isAvailabilityOnlyFailure(MIXED), false)
  assert.equal(isAvailabilityOnlyFailure(OK), false)
})

test("partitionFailures full scope: third-party outages do not block main", () => {
  const partition = partitionFailures([OK, GOOGLE_404, SITE_DOWN, HOSTED_MISSING, TOO_SMALL], {
    blockingSlugs: null,
  })
  assert.deepEqual(
    partition.blocking.map((r) => r.slug),
    ["naranja-x", "tiny"],
  )
  assert.deepEqual(
    partition.unavailable.map((r) => r.slug),
    ["adecoagro", "molino-canuelas"],
  )
  assert.deepEqual(partition.outOfScope, [])
})

test("partitionFailures full scope with strictAvailability blocks on outages", () => {
  const partition = partitionFailures([GOOGLE_404, TOO_SMALL], {
    blockingSlugs: null,
    strictAvailability: true,
  })
  assert.deepEqual(
    partition.blocking.map((r) => r.slug),
    ["adecoagro", "tiny"],
  )
  assert.deepEqual(partition.unavailable, [])
})

test("partitionFailures PR scope: touched entities block even on 404", () => {
  const partition = partitionFailures([GOOGLE_404, SITE_DOWN, TOO_SMALL], {
    blockingSlugs: new Set(["adecoagro"]),
  })
  assert.deepEqual(
    partition.blocking.map((r) => r.slug),
    ["adecoagro"],
  )
  assert.deepEqual(
    partition.unavailable.map((r) => r.slug),
    ["molino-canuelas"],
  )
  assert.deepEqual(
    partition.outOfScope.map((r) => r.slug),
    ["tiny"],
  )
})

test("partitionFailures PR scope with no entity changes never blocks", () => {
  const partition = partitionFailures([GOOGLE_404, TOO_SMALL], { blockingSlugs: new Set() })
  assert.equal(partition.blocking.length, 0)
})

test("renderUnavailableIssueBody lists slugs sorted and escapes pipes", () => {
  const body = renderUnavailableIssueBody(
    [SITE_DOWN, result("pipe", "https://p.example/a|b.png", ["fetch-failed"]), GOOGLE_404],
    { runUrl: "https://github.com/o/r/actions/runs/1", date: "2026-11-09" },
  )
  assert.match(body, /\*\*3\*\* logo\(s\)/)
  assert.match(body, /2026-11-09/)
  assert.match(body, /Run: https:\/\/github\.com\/o\/r\/actions\/runs\/1/)
  assert.ok(body.indexOf("`adecoagro`") < body.indexOf("`molino-canuelas`"))
  assert.ok(body.indexOf("`molino-canuelas`") < body.indexOf("`pipe`"))
  assert.match(body, /a\\\|b\.png/)
  assert.doesNotMatch(body, /\n\n\n/)
})

test("end to end: Google favicon 404 + network error are non-blocking on main", async () => {
  const fetchImpl = (async (input: string | URL | Request) => {
    const url = String(input)
    if (url.includes("googleusercontent")) return new Response("", { status: 404 })
    throw new TypeError("fetch failed")
  }) as typeof fetch

  const results = await checkEntityLogos(
    [
      {
        id: 1,
        name: "Adecoagro",
        domain: "www.adecoagro.com",
        slug: "adecoagro",
        logoUrl: "",
      },
      {
        id: 2,
        name: "Molino",
        domain: "molinocanuelas.com",
        slug: "molino",
        logoUrl: "https://molinocanuelas.com/logo.png",
        logoSource: "site",
      },
    ],
    {
      fetchImpl,
      skipRedirectCheck: true,
      skipVisualCheck: true,
      fetchRetry: { sleep: async () => {} },
    },
  )

  assert.equal(results.every((r) => !r.ok), true)
  const partition = partitionFailures(results, { blockingSlugs: null })
  assert.equal(partition.blocking.length, 0)
  assert.equal(partition.unavailable.length, 2)
})

test("isLikelyNetworkOutage flags mass failures as a runner problem", () => {
  assert.equal(isLikelyNetworkOutage(3, 400), false)
  assert.equal(isLikelyNetworkOutage(100, 400), false)
  assert.equal(isLikelyNetworkOutage(101, 400), true)
  assert.equal(isLikelyNetworkOutage(294, 400), true)
  assert.equal(isLikelyNetworkOutage(0, 0), false)
})
