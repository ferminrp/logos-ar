const DEFAULT_SITE_URL = 'https://loguitos.app'

export function getSiteUrl(): string {
  const fromEnv =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_PROJECT_PRODUCTION_URL
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL.startsWith('http')
        ? process.env.VERCEL_PROJECT_PRODUCTION_URL
        : `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
      : null)

  return fromEnv ?? DEFAULT_SITE_URL
}
