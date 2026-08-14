const siteUrl =
  process.env.NEXT_PUBLIC_SITE_URL ??
  process.env.NEXT_PUBLIC_APP_URL ??
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? process.env.VERCEL_PROJECT_PRODUCTION_URL.startsWith('http')
      ? process.env.VERCEL_PROJECT_PRODUCTION_URL
      : `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'https://loguitos.app')

/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  async headers() {
    const homeLinkHeader = [
      `<${siteUrl}/.well-known/api-catalog>; rel="api-catalog"`,
      `<${siteUrl}/api/logos>; rel="item"; type="application/json"`,
    ].join(', ')

    return [
      {
        source: '/',
        headers: [
          {
            key: 'Link',
            value: homeLinkHeader,
          },
        ],
      },
      {
        source: '/sitemap.xml',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
      {
        source: '/robots.txt',
        headers: [
          {
            key: 'Cache-Control',
            value:
              'public, max-age=86400, s-maxage=86400, stale-while-revalidate=604800',
          },
        ],
      },
    ]
  },
}

export default nextConfig
