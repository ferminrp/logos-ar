import type { Entity } from "./logos-data.ts"
import { getGoogleFaviconUrl } from "./favicon-urls.ts"
import { getLogoOverride } from "./logo-overrides.ts"
import { GOOGLE_FAVICON_CHECK_SIZE } from "./logo-quality/constants.ts"
import { getSiteUrl } from "./site-url.ts"

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

export function resolveEntityLogoUrl(
  logoUrl: string,
  baseUrl: string = getSiteUrl(),
): string {
  if (logoUrl.startsWith("/")) {
    return new URL(logoUrl, baseUrl.endsWith("/") ? baseUrl : `${baseUrl}/`).href
  }
  return logoUrl
}

export function getAbsoluteEntityLogoUrl(
  entity: Pick<Entity, "domain" | "logoUrl">,
  size = GOOGLE_FAVICON_CHECK_SIZE,
  baseUrl?: string,
): string {
  return resolveEntityLogoUrl(getEntityLogoUrl(entity, size), baseUrl)
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
