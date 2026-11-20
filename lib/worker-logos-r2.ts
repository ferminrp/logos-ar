import {
  applyLogoPngSecurityHeaders,
  applyLogoSvgSecurityHeaders,
} from './logo-image-security-headers.ts'

/** Immutable cache for flat catalog assets at /logos/<slug>.{png,svg}. */
export const HOSTED_LOGO_CACHE_CONTROL =
  'public, max-age=31536000, immutable'

export const R2_LOGOS_PREFIX = 'loguitos.app/logos/'

const SLUG_PATTERN = /^[a-z0-9-]+$/

export type HostedLogoExtension = 'png' | 'svg'

export type ParsedHostedLogoPath = {
  slug: string
  ext: HostedLogoExtension
}

export type HostedR2Head = {
  size?: number
  etag?: string
  httpEtag?: string
}

export type HostedR2Body = HostedR2Head & {
  body?: ReadableStream | ArrayBuffer | ArrayBufferView | string | null
}

export type LogosR2Bucket = {
  head: (key: string) => Promise<HostedR2Head | null>
  get: (key: string) => Promise<HostedR2Body | null>
}

export type HostedLogoWorkerEnv = {
  LOGOS?: LogosR2Bucket
  ASSETS: {
    fetch: (request: Request | string | URL) => Promise<Response>
  }
}

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

/** Maps public URL `/logos/<slug>.<ext>` to slug + canonical R2 filename. */
export function parseHostedLogoPathname(
  pathname: string,
): ParsedHostedLogoPath | null {
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

function contentTypeForExtension(ext: HostedLogoExtension): string {
  return ext === 'png' ? 'image/png' : 'image/svg+xml'
}

function buildLogoResponseHeaders(
  ext: HostedLogoExtension,
  etag: string | null,
): Headers {
  const headers = new Headers()
  headers.set('Content-Type', contentTypeForExtension(ext))
  headers.set('Cache-Control', HOSTED_LOGO_CACHE_CONTROL)
  if (etag) {
    headers.set('ETag', etag)
  }
  if (ext === 'png') {
    applyLogoPngSecurityHeaders(headers)
  } else {
    applyLogoSvgSecurityHeaders(headers)
  }
  return headers
}

function etagMatches(ifNoneMatch: string | null, etag: string | null): boolean {
  if (!ifNoneMatch || !etag) {
    return false
  }
  const quoted = etag.startsWith('"') ? etag : `"${etag}"`
  const weak = `W/${quoted}`
  for (const part of ifNoneMatch.split(',')) {
    const token = part.trim()
    if (token === '*' || token === etag || token === quoted || token === weak) {
      return true
    }
  }
  return false
}

function notModifiedHeaders(ext: HostedLogoExtension, etag: string | null): Headers {
  const headers = buildLogoResponseHeaders(ext, etag)
  return headers
}

async function responseFromR2(
  request: Request,
  object: HostedR2Head | HostedR2Body,
  ext: HostedLogoExtension,
): Promise<Response> {
  const etag = object.httpEtag ?? object.etag ?? null
  if (etagMatches(request.headers.get('If-None-Match'), etag)) {
    return new Response(null, {
      status: 304,
      headers: notModifiedHeaders(ext, etag),
    })
  }

  const headers = buildLogoResponseHeaders(ext, etag)
  if (request.method === 'HEAD') {
    const len = 'size' in object && object.size != null ? String(object.size) : null
    if (len) {
      headers.set('Content-Length', len)
    }
    return new Response(null, { status: 200, headers })
  }

  if ('body' in object && object.body != null) {
    return new Response(object.body as BodyInit, { status: 200, headers })
  }

  return new Response(null, { status: 404 })
}

async function tryR2HostedLogo(
  request: Request,
  env: HostedLogoWorkerEnv,
  parsed: ParsedHostedLogoPath,
): Promise<Response | null> {
  const bucket = env.LOGOS
  if (!bucket) {
    return null
  }

  const key = r2ObjectKeyForHostedLogo(parsed.slug, parsed.ext)
  const head = await bucket.head(key)
  if (!head) {
    return null
  }

  if (request.method === 'HEAD') {
    return responseFromR2(request, head, parsed.ext)
  }

  const body = await bucket.get(key)
  if (!body) {
    return null
  }

  return responseFromR2(request, body, parsed.ext)
}

async function fallbackAssetsHostedLogo(
  request: Request,
  env: HostedLogoWorkerEnv,
): Promise<Response> {
  const assetsResponse = await env.ASSETS.fetch(request)
  if (assetsResponse.status === 404) {
    return assetsResponse
  }

  const parsed = parseHostedLogoPathname(new URL(request.url).pathname)
  if (!parsed) {
    return assetsResponse
  }

  const headers = new Headers(assetsResponse.headers)
  headers.set('Cache-Control', HOSTED_LOGO_CACHE_CONTROL)
  const contentType = contentTypeForExtension(parsed.ext)
  headers.set('Content-Type', contentType)
  if (parsed.ext === 'png') {
    applyLogoPngSecurityHeaders(headers)
  } else {
    applyLogoSvgSecurityHeaders(headers)
  }

  if (request.method === 'HEAD') {
    return new Response(null, {
      status: assetsResponse.status,
      statusText: assetsResponse.statusText,
      headers,
    })
  }

  return new Response(assetsResponse.body, {
    status: assetsResponse.status,
    statusText: assetsResponse.statusText,
    headers,
  })
}

/**
 * Serve `/logos/<slug>.png|svg` from R2 with static asset fallback.
 * Returns null when the path is not a hosted flat logo URL (delegate to Astro).
 */
export async function maybeServeHostedLogo(
  request: Request,
  env: HostedLogoWorkerEnv,
): Promise<Response | null> {
  const { pathname } = new URL(request.url)
  const parsed = parseHostedLogoPathname(pathname)
  if (!parsed) {
    if (/^\/logos\/[^/]+\.(png|svg)$/.test(pathname)) {
      return new Response('Not Found', { status: 404 })
    }
    return null
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    })
  }

  const fromR2 = await tryR2HostedLogo(request, env, parsed)
  if (fromR2) {
    return fromR2
  }

  return fallbackAssetsHostedLogo(request, env)
}