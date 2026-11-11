/**
 * CLI: logo detail touch-target + PNG contrast smoke (2–3 slugs, 390 + 1440 widths).
 */
import {
  runLogoDetailA11ySmokeCli,
} from "./logo-detail-a11y-smoke.mts"

const baseUrl = (
  process.env.VERIFY_LOGUITOS_BASE_URL ?? "http://127.0.0.1:3100"
).replace(/\/$/, "")

runLogoDetailA11ySmokeCli(baseUrl).catch((error) => {
  console.error(error instanceof Error ? error.message : error)
  process.exit(1)
})
