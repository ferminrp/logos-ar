/**
 * Fase 2 sponsor slot (Opción A) — targeting and copy for `/logo/<slug>`.
 * See brief: uploads/BRIEF-FASE2-SWE.md
 */

export function isSponsorSlotEnabled(): boolean {
  return process.env.NEXT_PUBLIC_SLOT_SPONSOR !== "off"
}

/** Slugs where showing a Lemon fintech affiliate would conflict with another brand on that page. */
const LEMON_FINTECH_EXCLUDED_SLUGS = new Set([
  "uala",
  "mercado-pago",
  "lemon-cash",
  "belo",
  "prex",
  "personal-pay",
  "modo",
  "ripio",
  "fiwind",
  "wise",
  "payoneer",
  "astropay",
  "claro-pay",
])

const lemonCampaign = {
  advertiserInitials: "LC",
  headline: "Abrí tu cuenta en Lemon y llevate USD 5 en BTC",
  subline: "Sin costo de apertura. Aplican términos.",
  /** Placeholder until final affiliate URL is configured. */
  href:
    process.env.NEXT_PUBLIC_SPONSOR_LEMON_HREF ??
    "https://example.com/?ref=loguitos",
} as const

export type SponsorSlotResolved =
  | { kind: "lemon"; campaign: typeof lemonCampaign }
  | { kind: "house" }

/**
 * Resolves what to show inside the sponsor shell when the feature is enabled.
 */
export function resolveSponsorSlotContent(input: {
  categoryId: string
  slug: string
}): SponsorSlotResolved {
  if (input.categoryId === "fintechs") {
    if (LEMON_FINTECH_EXCLUDED_SLUGS.has(input.slug)) {
      return { kind: "house" }
    }
    return { kind: "lemon", campaign: lemonCampaign }
  }
  return { kind: "house" }
}

export function getLemonFintechExcludedSlugsForTests(): string[] {
  return [...LEMON_FINTECH_EXCLUDED_SLUGS]
}
