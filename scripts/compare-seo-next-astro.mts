import { readFileSync } from 'node:fs'

const nextBase = process.env.NEXT_BASE ?? 'http://127.0.0.1:3001'
const astroBase = process.env.ASTRO_BASE ?? 'http://127.0.0.1:8787'

function extractSitemapPaths(xml: string): string[] {
  const locs = [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((m) => {
    const url = new URL(m[1]!)
    return url.pathname
  })
  return [...new Set(locs)].sort()
}

function parseMeta(html: string) {
  const pick = (pattern: RegExp) => pattern.exec(html)?.[1]?.trim() ?? ''
  const title = pick(/<title[^>]*>([^<]*)<\/title>/i)
  const description = pick(
    /<meta[^>]+name=["']description["'][^>]+content=["']([^"']*)["']/i,
  )
  const canonical = pick(
    /<link[^>]+rel=["']canonical["'][^>]+href=["']([^"']*)["']/i,
  )
  const ogTitle = pick(
    /<meta[^>]+property=["']og:title["'][^>]+content=["']([^"']*)["']/i,
  )
  const ogDescription = pick(
    /<meta[^>]+property=["']og:description["'][^>]+content=["']([^"']*)["']/i,
  )
  const twitterTitle = pick(
    /<meta[^>]+name=["']twitter:title["'][^>]+content=["']([^"']*)["']/i,
  )
  const jsonLd = [
    ...html.matchAll(
      /<script[^>]+type=["']application\/ld\+json["'][^>]*>([\s\S]*?)<\/script>/gi,
    ),
  ].map((m) => m[1]!.trim())
  return {
    title,
    description,
    canonical,
    ogTitle,
    ogDescription,
    twitterTitle,
    jsonLd,
  }
}

async function fetchMeta(
  base: string,
  path: string,
): Promise<{ status: number; redirected: boolean; location: string | null; meta: ReturnType<typeof parseMeta> }> {
  const res = await fetch(`${base}${path}`, { redirect: 'manual' })
  const location = res.headers.get('location')
  if (res.status >= 300 && res.status < 400) {
    return {
      status: res.status,
      redirected: true,
      location,
      meta: {
        title: '',
        description: '',
        canonical: '',
        ogTitle: '',
        ogDescription: '',
        twitterTitle: '',
        jsonLd: [],
      },
    }
  }
  const html = await res.text()
  return {
    status: res.status,
    redirected: false,
    location,
    meta: parseMeta(html),
  }
}

const redirectPaths = ['/categoria/delivery']
const gonePaths = ['/logo/melia']

const samplePaths = [
  '/',
  '/categoria/bancos',
  '/logo/banco-provincia',
  '/logo/changan',
  '/banderas',
  '/robots.txt',
  '/sitemap.xml',
  ...redirectPaths,
]

async function main() {
  const nextSitemap = readFileSync(
    process.env.NEXT_SITEMAP ?? '/tmp/logos-ar-next/public/sitemap.xml',
    'utf8',
  )
  const astroSitemap = readFileSync('public/sitemap.xml', 'utf8')
  const nextUrls = extractSitemapPaths(nextSitemap)
  const astroUrls = extractSitemapPaths(astroSitemap)

  const onlyNext = nextUrls.filter((u) => !astroUrls.includes(u))
  const onlyAstro = astroUrls.filter((u) => !nextUrls.includes(u))

  console.log(`Sitemap: Next ${nextUrls.length}, Astro ${astroUrls.length}`)
  if (onlyNext.length || onlyAstro.length) {
    console.error('Sitemap path diff:', { onlyNext, onlyAstro })
    process.exit(1)
  }
  console.log('Sitemap set: identical ✓')

  const diffs: string[] = []
  for (const path of samplePaths) {
    const [n, a] = await Promise.all([
      fetchMeta(nextBase, path),
      fetchMeta(astroBase, path),
    ])
    if (n.status !== a.status) {
      diffs.push(`${path}: status ${n.status} vs ${a.status}`)
    }
    if (gonePaths.includes(path)) {
      if (n.status !== 404 || a.status !== 404) {
        diffs.push(`${path}: expected 404, got ${n.status}/${a.status}`)
      }
      continue
    }
    if (redirectPaths.includes(path)) {
      if (n.status < 300 || n.status >= 400 || a.status < 300 || a.status >= 400) {
        diffs.push(`${path}: expected redirect, got ${n.status}/${a.status}`)
      } else if (n.status !== a.status) {
        diffs.push(`${path}: redirect code ${n.status} vs ${a.status}`)
      }
      continue
    }
    if (n.status !== 200 || a.status !== 200) continue
    const keys = [
      'title',
      'description',
      'canonical',
      'ogTitle',
      'ogDescription',
      'twitterTitle',
    ] as const
    for (const key of keys) {
      const nv = n.meta[key].replace(nextBase, 'https://loguitos.app').replace('http://127.0.0.1:3001', 'https://loguitos.app')
      const av = a.meta[key].replace(astroBase, 'https://loguitos.app').replace('http://127.0.0.1:8787', 'https://loguitos.app')
      if (nv !== av) {
        diffs.push(`${path}: ${key}\n  next: ${nv}\n  astro: ${av}`)
      }
    }
    if (JSON.stringify(n.meta.jsonLd) !== JSON.stringify(a.meta.jsonLd)) {
      diffs.push(`${path}: JSON-LD mismatch`)
    }
  }

  if (diffs.length) {
    console.error('SEO diffs:\n' + diffs.join('\n\n'))
    process.exit(1)
  }
  console.log(`Sample paths (${samplePaths.length}): metadata match ✓`)
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})
