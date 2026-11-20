import { R2_LOGOS_PREFIX } from './hosted-logos-path.ts'

/** R2 list/get JSON etags are raw 32-char hex MD5 for single-part uploads. */
export function normalizeR2ObjectEtag(etag: string | undefined): string | null {
  if (!etag) return null
  const stripped = etag.replace(/^"/, '').replace(/"$/, '').trim().toLowerCase()
  if (!/^[a-f0-9]{32}$/.test(stripped)) {
    return null
  }
  return stripped
}

export function shouldSkipLogoUpload(
  localMd5: string,
  remoteEtag: string | null | undefined,
): boolean {
  const normalized = normalizeR2ObjectEtag(remoteEtag ?? undefined)
  if (!normalized) return false
  return localMd5 === normalized
}

export type R2ListObjectRow = { key?: string; etag?: string }

export function etagMapFromListedObjects(
  objects: R2ListObjectRow[],
): Map<string, string> {
  const map = new Map<string, string>()
  for (const row of objects) {
    if (!row.key) continue
    const etag = normalizeR2ObjectEtag(row.etag)
    if (etag) {
      map.set(row.key, etag)
    }
  }
  return map
}

export type CloudflareR2ListPage = {
  result?: R2ListObjectRow[]
  success?: boolean
  result_info?: {
    cursor?: string
    is_truncated?: boolean
  }
}

export type ListR2EtagsOptions = {
  accountId: string
  apiToken: string
  bucket: string
  prefix?: string
  fetchImpl?: typeof fetch
  perPage?: number
}

export async function listR2ObjectEtags(
  options: ListR2EtagsOptions,
): Promise<Map<string, string>> {
  const {
    accountId,
    apiToken,
    bucket,
    prefix = R2_LOGOS_PREFIX,
    fetchImpl = fetch,
    perPage = 1000,
  } = options

  const merged = new Map<string, string>()
  let cursor: string | undefined

  do {
    const url = new URL(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects`,
    )
    url.searchParams.set('prefix', prefix)
    url.searchParams.set('per_page', String(perPage))
    if (cursor) {
      url.searchParams.set('cursor', cursor)
    }

    const response = await fetchImpl(url, {
      headers: {
        Authorization: `Bearer ${apiToken}`,
        Accept: 'application/json',
      },
    })

    if (!response.ok) {
      const body = await response.text()
      throw new Error(
        `R2 list failed (${response.status}): ${body.slice(0, 200)}`,
      )
    }

    const json = (await response.json()) as CloudflareR2ListPage
    if (!json.success) {
      throw new Error('R2 list API returned success=false')
    }

    const page = etagMapFromListedObjects(json.result ?? [])
    for (const [key, etag] of page) {
      merged.set(key, etag)
    }

    const truncated = json.result_info?.is_truncated === true
    cursor = truncated ? json.result_info?.cursor : undefined
  } while (cursor)

  return merged
}

export function resolveCloudflareApiCredentials(): {
  accountId: string
  apiToken: string
} | null {
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim()
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim()
  if (!accountId || !apiToken) {
    return null
  }
  return { accountId, apiToken }
}