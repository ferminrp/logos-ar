import assert from "node:assert/strict"
import test from "node:test"
import {
  contrastRatioHex,
  contrastRatioOklch,
  MIN_SLOT_BORDER_CONTRAST,
} from "./wcag-oklch-contrast.ts"

test("WCAG reference: #767676 on white ≈ 4.54:1", () => {
  const ratio = contrastRatioHex("#767676", "#ffffff")
  assert.ok(Math.abs(ratio - 4.54) < 0.02, `expected ~4.54, got ${ratio}`)
})

test("WCAG reference: black on white = 21:1", () => {
  const ratio = contrastRatioHex("#000000", "#ffffff")
  assert.ok(Math.abs(ratio - 21) < 0.05, `expected 21, got ${ratio}`)
})

test("light slot-border meets minimum against site background", () => {
  const ratio = contrastRatioOklch(
    "oklch(0.64 0.010 85)",
    "oklch(0.975 0.004 95)",
  )
  assert.ok(
    ratio >= MIN_SLOT_BORDER_CONTRAST,
    `light slot-border contrast ${ratio.toFixed(2)} < ${MIN_SLOT_BORDER_CONTRAST}`,
  )
})

test("dark slot-border meets minimum against site background", () => {
  const ratio = contrastRatioOklch(
    "oklch(0.70 0.012 55)",
    "oklch(0.18 0.012 55)",
  )
  assert.ok(
    ratio >= MIN_SLOT_BORDER_CONTRAST,
    `dark slot-border contrast ${ratio.toFixed(2)} < ${MIN_SLOT_BORDER_CONTRAST}`,
  )
})
