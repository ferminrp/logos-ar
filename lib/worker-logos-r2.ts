import {
  applyLogoPngSecurityHeaders,
  applyLogoSvgSecurityHeaders,
} from './logo-image-security-headers.ts'
import {
  assetsFallbackPathForIsotipo,
  hasCatalogIsotipo,
  r2ObjectKeyForIsotipo,
} from './isotipos-catalog.ts'
import {
  HOSTED_LOGO_CACHE_CONTROL,
  parseHostedLogoPathname,
  parseIsotipoPathname,
  r2ObjectKeyForHostedLogo,
  type HostedLogoExtension,
} from './hosted-logos-path.ts'

export {
  HOSTED_LOGO_CACHE_CONTROL,
  R2_LOGOS_PREFIX,
  isValidHostedLogoSlug,
  parseHostedLogoPathname,
  parseIsotipoPathname,
  r2ObjectKeyForHostedLogo,
  type HostedLogoExtension,
} from './hosted-logos-path.ts'

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

function buildIsotipoSvgResponseHeaders(etag: string | null): Headers {
  const headers = new Headers()
  headers.set('Content-Type', 'image/svg+xml')
  headers.set('Cache-Control', HOSTED_LOGO_CACHE_CONTROL)
  if (etag) {
    headers.set('ETag', etag)
  }
  applyLogoSvgSecurityHeaders(headers)
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
  return buildLogoResponseHeaders(ext, etag)
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

async function responseFromR2Isotipo(
  request: Request,
  object: HostedR2Head | HostedR2Body,
): Promise<Response> {
  const etag = object.httpEtag ?? object.etag ?? null
  if (etagMatches(request.headers.get('If-None-Match'), etag)) {
    return new Response(null, {
      status: 304,
      headers: buildIsotipoSvgResponseHeaders(etag),
    })
  }

  const headers = buildIsotipoSvgResponseHeaders(etag)
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

/**
 * One R2 operation per request (`head` for HEAD, `get` otherwise). Any R2 failure
 * resolves to null so the caller serves the static asset bundled with the Worker.
 */
async function readR2Object(
  request: Request,
  env: HostedLogoWorkerEnv,
  key: string,
): Promise<HostedR2Head | HostedR2Body | null> {
  const bucket = env.LOGOS
  if (!bucket) {
    return null
  }
  try {
    return request.method === 'HEAD'
      ? await bucket.head(key)
      : await bucket.get(key)
  } catch (error) {
    console.error(
      JSON.stringify({
        event: 'hosted_logo_r2_error',
        key,
        reason: error instanceof Error ? error.message : String(error),
      }),
    )
    return null
  }
}

async function tryR2HostedLogo(
  request: Request,
  env: HostedLogoWorkerEnv,
  parsed: ParsedHostedLogoPath,
): Promise<Response | null> {
  const key = r2ObjectKeyForHostedLogo(parsed.slug, parsed.ext)
  const object = await readR2Object(request, env, key)
  return object ? responseFromR2(request, object, parsed.ext) : null
}

async function tryR2Isotipo(
  request: Request,
  env: HostedLogoWorkerEnv,
  slug: string,
): Promise<Response | null> {
  const object = await readR2Object(request, env, r2ObjectKeyForIsotipo(slug))
  return object ? responseFromR2Isotipo(request, object) : null
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

async function fallbackAssetsIsotipo(
  request: Request,
  env: HostedLogoWorkerEnv,
  slug: string,
): Promise<Response> {
  const fallbackPath = assetsFallbackPathForIsotipo(slug)
  const fallbackUrl = new URL(fallbackPath, request.url)
  const fallbackRequest = new Request(fallbackUrl, {
    method: request.method,
    headers: request.headers,
  })
  const assetsResponse = await env.ASSETS.fetch(fallbackRequest)
  if (assetsResponse.status === 404) {
    return new Response('Not Found', { status: 404 })
  }

  const headers = new Headers(assetsResponse.headers)
  headers.set('Cache-Control', HOSTED_LOGO_CACHE_CONTROL)
  headers.set('Content-Type', 'image/svg+xml')
  applyLogoSvgSecurityHeaders(headers)

  const etag = assetsResponse.headers.get('ETag')
  if (etagMatches(request.headers.get('If-None-Match'), etag)) {
    return new Response(null, {
      status: 304,
      headers: buildIsotipoSvgResponseHeaders(etag),
    })
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

async function maybeServeHostedIsotipo(
  request: Request,
  env: HostedLogoWorkerEnv,
): Promise<Response | null> {
  const { pathname } = new URL(request.url)
  if (!/^\/logos\/[^/]+\/isotipo\.svg$/.test(pathname)) {
    return null
  }

  const parsed = parseIsotipoPathname(pathname)
  if (!parsed || !hasCatalogIsotipo(parsed.slug)) {
    return new Response('Not Found', { status: 404 })
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') {
    return new Response('Method Not Allowed', {
      status: 405,
      headers: { Allow: 'GET, HEAD' },
    })
  }

  const fromR2 = await tryR2Isotipo(request, env, parsed.slug)
  if (fromR2) {
    return fromR2
  }

  return fallbackAssetsIsotipo(request, env, parsed.slug)
}

/**
 * Serve `/logos/<slug>.png|svg` and `/logos/<slug>/isotipo.svg` from R2 with static fallback.
 * Returns null when the path is not a hosted logo URL (delegate to Astro).
 */
export async function maybeServeHostedLogo(
  request: Request,
  env: HostedLogoWorkerEnv,
): Promise<Response | null> {
  const isotipo = await maybeServeHostedIsotipo(request, env)
  if (isotipo) {
    return isotipo
  }

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