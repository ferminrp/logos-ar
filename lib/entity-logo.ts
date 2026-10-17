import type { Entity } from "./logos-data.ts"
import { getGoogleFaviconUrl } from "./favicon-urls.ts"
import { getLogoOverride } from "./logo-overrides.ts"
import { GOOGLE_FAVICON_CHECK_SIZE } from "./logo-quality/constants.ts"

export type LogoSourceKind = "google" | "site" | "wikimedia" | "hosted"

export function getEntityLogoUrl(
  entity: Pick<Entity, "domain" | "logoUrl">,
  size = GOOGLE_FAVICON_CHECK_SIZE,
): string {
  if (entity.logoUrl) {
    return entity.logoUrl
  }
  const override = getLogoOverride(entity.domain)
  if (override) {
    return override.logoUrl
  }
  return getGoogleFaviconUrl(entity.domain, size)
}

export function getEntityLogoSource(
  entity: Pick<Entity, "domain" | "logoUrl" | "logoSource">,
): LogoSourceKind {
  if (entity.logoUrl) {
    return entity.logoSource ?? "hosted"
  }
  const override = getLogoOverride(entity.domain)
  if (override) {
    return override.logoSource
  }
  return "google"
}
