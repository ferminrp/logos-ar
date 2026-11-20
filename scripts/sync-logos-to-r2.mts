/**
 * Upload hosted catalog logos from public/logos/ to R2 (loguitos-assets).
 *
 * Keys: loguitos.app/logos/<slug>/logo.png|.svg
 * Skips objects whose MD5 already matches the remote etag (idempotent).
 *
 * Prefers Cloudflare API list (fast): set CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN
 * with R2 read on the bucket. Otherwise falls back to `wrangler r2 object get -p`
 * per key (works with `wrangler login`, slower).
 */
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import {
  listR2ObjectEtags,
  resolveCloudflareApiCredentials,
  shouldSkipLogoUpload,
} from '../lib/sync-logos-r2-remote.ts'
import { md5Hex } from '../lib/sync-r2-digest.ts'
import {
  HOSTED_LOGO_CACHE_CONTROL,
  R2_LOGOS_PREFIX,
  r2ObjectKeyForHostedLogo,
  type HostedLogoExtension,
} from '../lib/hosted-logos-path.ts'

const execFile = promisify(execFileCb)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const LOGOS_DIR = path.join(REPO_ROOT, 'public/logos')
const BUCKET = 'loguitos-assets'

export { md5Hex } from '../lib/sync-r2-digest.ts'

export function slugFromPublicLogoFile(fileName: string): string | null {
  const match = /^([a-z0-9-]+)\.(png|svg)$/i.exec(fileName)
  if (!match?.[1] || !match[2]) return null
  return match[1].toLowerCase()
}

export function localExtension(fileName: string): HostedLogoExtension | null {
  if (fileName.endsWith('.png')) return 'png'
  if (fileName.endsWith('.svg')) return 'svg'
  return null
}

export type SyncLogosDeps = {
  loadRemoteEtags: () => Promise<Map<string, string>>
  remoteMd5ForKey: (objectKey: string) => Promise<string | null>
  putObject: (
    objectKey: string,
    filePath: string,
    contentType: string,
  ) => Promise<void>
}

async function loadRemoteEtagsDefault(): Promise<Map<string, string>> {
  const creds = resolveCloudflareApiCredentials()
  if (!creds) {
    console.warn(
      'sync-logos-to-r2: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN not set; using per-object wrangler get (slower).',
    )
    return new Map()
  }

  try {
    const map = await listR2ObjectEtags({
      accountId: creds.accountId,
      apiToken: creds.apiToken,
      bucket: BUCKET,
      prefix: R2_LOGOS_PREFIX,
    })
    console.log(`sync-logos-to-r2: listed ${map.size} remote object etag(s) via API`)
    return map
  } catch (error) {
    console.warn(
      'sync-logos-to-r2: R2 list API failed; falling back to per-object wrangler get.',
      error,
    )
    return new Map()
  }
}

async function remoteMd5ViaWranglerGet(objectKey: string): Promise<string | null> {
  try {
    const { stdout } = await execFile(
      'pnpm',
      [
        'exec',
        'wrangler',
        'r2',
        'object',
        'get',
        `${BUCKET}/${objectKey}`,
        '-p',
        '--remote',
      ],
      { cwd: REPO_ROOT, encoding: 'buffer', maxBuffer: 32 * 1024 * 1024 },
    )
    const buf = Buffer.isBuffer(stdout) ? stdout : Buffer.from(stdout)
    if (buf.length === 0) return null
    return md5Hex(new Uint8Array(buf))
  } catch {
    return null
  }
}

async function wranglerPutObject(
  objectKey: string,
  filePath: string,
  contentType: string,
): Promise<void> {
  await execFile(
    'pnpm',
    [
      'exec',
      'wrangler',
      'r2',
      'object',
      'put',
      `${BUCKET}/${objectKey}`,
      '--remote',
      '--file',
      filePath,
      '--content-type',
      contentType,
      '--cache-control',
      HOSTED_LOGO_CACHE_CONTROL,
    ],
    { cwd: REPO_ROOT },
  )
}

export const defaultSyncLogosDeps: SyncLogosDeps = {
  loadRemoteEtags: loadRemoteEtagsDefault,
  remoteMd5ForKey: remoteMd5ViaWranglerGet,
  putObject: wranglerPutObject,
}

export type SyncLogosResult = {
  uploaded: number
  skipped: number
  errors: number
}

export async function syncLogosToR2WithDeps(
  deps: SyncLogosDeps,
  logosDir = LOGOS_DIR,
): Promise<SyncLogosResult> {
  const remoteByKey = await deps.loadRemoteEtags()

  const names = await readdir(logosDir)
  let uploaded = 0
  let skipped = 0
  let errors = 0

  for (const name of names.sort()) {
    const ext = localExtension(name)
    const slug = slugFromPublicLogoFile(name)
    if (!slug || !ext) continue

    const filePath = path.join(logosDir, name)
    let bytes: Uint8Array
    try {
      bytes = new Uint8Array(await readFile(filePath))
    } catch {
      errors += 1
      continue
    }

    const digest = md5Hex(bytes)
    const key = r2ObjectKeyForHostedLogo(slug, ext)

    let remoteEtag = remoteByKey.get(key) ?? null
    if (!shouldSkipLogoUpload(digest, remoteEtag)) {
      const remoteMd5 = await deps.remoteMd5ForKey(key)
      if (remoteMd5 && shouldSkipLogoUpload(digest, remoteMd5)) {
        remoteEtag = remoteMd5
      }
    }

    if (shouldSkipLogoUpload(digest, remoteEtag)) {
      skipped += 1
      continue
    }

    const contentType = ext === 'png' ? 'image/png' : 'image/svg+xml'
    try {
      await deps.putObject(key, filePath, contentType)
      uploaded += 1
      console.log(`uploaded ${key}`)
    } catch (error) {
      errors += 1
      console.error(`failed ${key}:`, error)
    }
  }

  return { uploaded, skipped, errors }
}

export async function syncLogosToR2(logosDir = LOGOS_DIR): Promise<SyncLogosResult> {
  return syncLogosToR2WithDeps(defaultSyncLogosDeps, logosDir)
}

async function main() {
  const result = await syncLogosToR2()
  console.log(
    `sync-logos-to-r2: uploaded=${result.uploaded} skipped=${result.skipped} errors=${result.errors}`,
  )
  if (result.errors > 0) {
    process.exitCode = 1
  }
}

const isCli =
  process.argv[1] &&
  path.resolve(process.argv[1]) === path.resolve(fileURLToPath(import.meta.url))

if (isCli) {
  main().catch((error) => {
    console.error(error)
    process.exitCode = 1
  })
}