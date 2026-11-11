import assert from "node:assert/strict"
import test from "node:test"
import {
  getLemonFintechExcludedSlugsForTests,
  resolveSponsorSlotContent,
} from "./sponsor-slot.ts"

test("never shows Lemon campaign on competitor fintech slug (Ualá)", () => {
  const r = resolveSponsorSlotContent({ categoryId: "fintechs", slug: "uala" })
  assert.equal(r.kind, "house")
})

test("shows Lemon campaign on non-excluded fintech slug", () => {
  const r = resolveSponsorSlotContent({ categoryId: "fintechs", slug: "nubi" })
  assert.equal(r.kind, "lemon")
  if (r.kind === "lemon") {
    assert.equal(r.campaign.headline.includes("Lemon"), true)
  }
})

test("banks get house ad, not Lemon fintech campaign", () => {
  const r = resolveSponsorSlotContent({
    categoryId: "bancos",
    slug: "banco-de-la-nacion-argentina",
  })
  assert.equal(r.kind, "house")
})

test("exclusion list includes required competitor slugs", () => {
  const excluded = new Set(getLemonFintechExcludedSlugsForTests())
  for (const slug of ["uala", "mercado-pago", "lemon-cash"]) {
    assert.equal(excluded.has(slug), true)
  }
})
