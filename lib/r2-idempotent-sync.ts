import { shouldSkipLogoUpload } from './sync-logos-r2-remote.ts'
import { md5Hex } from './sync-r2-digest.ts'

export type R2SyncEntry = {
  objectKey: string
  filePath: string
  contentType: string
  bytes: Uint8Array
}

export type R2SyncPutContext = {
  objectKey: string
  filePath: string
  contentType: string
  bytes: Uint8Array
  digest: string
}

export type R2SyncDeps = {
  loadRemoteEtags: () => Promise<Map<string, string>>
  remoteMd5ForKey: (objectKey: string) => Promise<string | null>
  putObject: (ctx: R2SyncPutContext) => Promise<void>
}

export type R2SyncResult = {
  uploaded: number
  skipped: number
  errors: number
}

export async function runIdempotentR2Sync(
  deps: R2SyncDeps,
  entries: R2SyncEntry[],
  options?: { dryRun?: boolean },
): Promise<R2SyncResult> {
  const remoteByKey = await deps.loadRemoteEtags()
  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (const entry of entries) {
    const digest = md5Hex(entry.bytes)

    let remoteEtag = remoteByKey.get(entry.objectKey) ?? null
    if (!shouldSkipLogoUpload(digest, remoteEtag)) {
      const remoteMd5 = await deps.remoteMd5ForKey(entry.objectKey)
      if (remoteMd5 && shouldSkipLogoUpload(digest, remoteMd5)) {
        remoteEtag = remoteMd5
      }
    }

    if (shouldSkipLogoUpload(digest, remoteEtag)) {
      skipped += 1
      continue
    }

    if (options?.dryRun) {
      console.log(`dry-run would upload ${entry.objectKey}`)
      uploaded += 1
      continue
    }

    try {
      await deps.putObject({
        objectKey: entry.objectKey,
        filePath: entry.filePath,
        contentType: entry.contentType,
        bytes: entry.bytes,
        digest,
      })
      uploaded += 1
      console.log(`uploaded ${entry.objectKey}`)
    } catch (error) {
      errors += 1
      console.error(`failed ${entry.objectKey}:`, error)
    }
  }

  return { uploaded, skipped, errors }
}