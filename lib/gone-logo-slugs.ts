/** Logo pages removed from the catalog (no redirect; respond 404 Not Found). */
export const GONE_LOGO_SLUGS = new Set<string>(["melia"])

export function isGoneLogoSlug(slug: string): boolean {
  return GONE_LOGO_SLUGS.has(slug)
}
