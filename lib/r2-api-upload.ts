import { Buffer } from 'node:buffer'
import { HOSTED_LOGO_CACHE_CONTROL } from './hosted-logos-path.ts'

export type R2ApiPutOptions = {
  accountId: string
  apiToken: string
  bucket: string
  objectKey: string
  body: Uint8Array
  contentType: string
  cacheControl?: string
  customMetadata?: Record<string, string>
  fetchImpl?: typeof fetch
}

/** PUT object via Cloudflare REST (supports x-amz-meta-* custom metadata). */
export async function putR2ObjectViaCloudflareApi(
  options: R2ApiPutOptions,
): Promise<void> {
  const {
    accountId,
    apiToken,
    bucket,
    objectKey,
    body,
    contentType,
    cacheControl = HOSTED_LOGO_CACHE_CONTROL,
    customMetadata,
    fetchImpl = fetch,
  } = options

  const url = new URL(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/r2/buckets/${bucket}/objects/${objectKey}`,
  )

  const headers: Record<string, string> = {
    Authorization: `Bearer ${apiToken}`,
    'Content-Type': contentType,
    'Cache-Control': cacheControl,
  }

  if (customMetadata) {
    for (const [key, value] of Object.entries(customMetadata)) {
      headers[`x-amz-meta-${key}`] = value
    }
  }

  const response = await fetchImpl(url, {
    method: 'PUT',
    headers,
    body: new Blob([Buffer.from(body)]),
  })

  if (!response.ok) {
    const text = await response.text()
    throw new Error(
      `R2 API put failed (${response.status}) for ${objectKey}: ${text.slice(0, 300)}`,
    )
  }

  const json = (await response.json()) as { success?: boolean }
  if (!json.success) {
    throw new Error(`R2 API put success=false for ${objectKey}`)
  }
}