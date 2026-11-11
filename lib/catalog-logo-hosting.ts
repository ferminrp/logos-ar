import type { EntityRecord } from './entity-index.ts'
import { getEntityLogoUrl } from './entity-logo.ts'
import { isGoogleFaviconUrl } from './logo-quality/check.ts'

/** Catalog tiles must not hotlink arbitrary third-party origins (CORP/ORB). */
export function isSelfHostedCatalogLogoUrl(logoUrl: string): boolean {
  return logoUrl.startsWith('/')
}

const DUCK_FAVICON_HOST = 'icons.duckduckgo.com'

export function isDuckDuckGoFaviconUrl(logoUrl: string): boolean {
  try {
    return new URL(logoUrl).hostname === DUCK_FAVICON_HOST
  } catch {
    return false
  }
}

export function isAllowedRemoteCatalogLogoUrl(logoUrl: string): boolean {
  if (isSelfHostedCatalogLogoUrl(logoUrl)) return true
  if (isGoogleFaviconUrl(logoUrl)) return true
  if (isDuckDuckGoFaviconUrl(logoUrl)) return true
  return false
}

export interface ThirdPartyCatalogLogo {
  slug: string
  name: string
  domain: string
  logoUrl: string
}

export function listThirdPartyCatalogLogos(
  entities: Iterable<EntityRecord> = [],
): ThirdPartyCatalogLogo[] {
  const out: ThirdPartyCatalogLogo[] = []
  for (const entity of entities) {
    const logoUrl = getEntityLogoUrl(entity)
    if (isAllowedRemoteCatalogLogoUrl(logoUrl)) continue
    out.push({
      slug: entity.slug,
      name: entity.name,
      domain: entity.domain,
      logoUrl,
    })
  }
  return out.sort((a, b) => a.slug.localeCompare(b.slug))
}
