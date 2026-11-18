import { resolveWorkerSiteUrl } from '../apply-home-discovery-headers.ts'
import { getSiteUrl } from '../site-url.ts'

const CANONICAL_HOSTS = new Set(['loguitos.app', 'www.loguitos.app'])

/**
 * Absolute URLs in MCP tool payloads: preview aliases keep the request origin;
 * production hosts always use the configured canonical site URL (loguitos.app).
 */
export function resolveMcpPublicSiteUrl(
  request: Request,
  env: Record<string, unknown> = {},
): string {
  try {
    const host = new URL(request.url).hostname.toLowerCase()
    if (CANONICAL_HOSTS.has(host)) {
      return getSiteUrl().replace(/\/$/, '')
    }
  } catch {
    // fall through
  }
  return resolveWorkerSiteUrl(request, env)
}