/** Shared path/key helpers for flat logos and isotipos (no worker imports). */

export const HOSTED_LOGO_CACHE_CONTROL =
  'public, max-age=31536000, immutable'

export const R2_LOGOS_PREFIX = 'loguitos.app/logos/'

const SLUG_PATTERN = /^[a-z0-9-]+$/

export type HostedLogoExtension = 'png' | 'svg'

export function isValidHostedLogoSlug(slug: string): boolean {
  return slug.length > 0 && SLUG_PATTERN.test(slug)
}

export function r2ObjectKeyForHostedLogo(
  slug: string,
  ext: HostedLogoExtension,
): string {
  const file = ext === 'png' ? 'logo.png' : 'logo.svg'
  return `${R2_LOGOS_PREFIX}${slug}/${file}`
}

export function parseHostedLogoPathname(
  pathname: string,
): { slug: string; ext: HostedLogoExtension } | null {
  const match = /^\/logos\/([^/]+)\.(png|svg)$/.exec(pathname)
  if (!match?.[1] || !match[2]) {
    return null
  }
  const ext = match[2] as HostedLogoExtension
  const slug = match[1]
  if (!isValidHostedLogoSlug(slug)) {
    return null
  }
  return { slug, ext }
}

/** Public URL `/logos/<slug>/isotipo.svg`. */
export function parseIsotipoPathname(pathname: string): { slug: string } | null {
  const match = /^\/logos\/([^/]+)\/isotipo\.svg$/.exec(pathname)
  if (!match?.[1]) {
    return null
  }
  const slug = match[1]
  if (!isValidHostedLogoSlug(slug)) {
    return null
  }
  return { slug }
}