const DEFAULT_SITE_URL = 'https://loguitos.app'

function envSiteUrl(): string | null {
  const fromImportMeta =
    typeof import.meta !== 'undefined' &&
    typeof import.meta.env?.PUBLIC_SITE_URL === 'string' &&
    import.meta.env.PUBLIC_SITE_URL.trim()
      ? import.meta.env.PUBLIC_SITE_URL.trim()
      : null

  const fromNode =
    typeof process !== 'undefined'
      ? (process.env.PUBLIC_SITE_URL ??
        process.env.NEXT_PUBLIC_SITE_URL ??
        process.env.NEXT_PUBLIC_APP_URL ??
        null)
      : null

  return fromImportMeta ?? fromNode
}

export function getSiteUrl(): string {
  return envSiteUrl() ?? DEFAULT_SITE_URL
}
