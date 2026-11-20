/**
 * Upload isotype SVGs from data/isotipos/ to R2 (loguitos-assets).
 *
 * Keys: loguitos.app/logos/<slug>/isotipo.svg
 * Requires CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN (custom metadata).
 * Idempotent via MD5 vs remote etag. Refuses slugs absent from logos-dataset hosted URLs.
 */
import { readFile, readdir } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import {
  catalogSlugSetForIsotipoSync,
  getIsotipoRecord,
  r2ObjectKeyForIsotipo,
} from '../lib/isotipos-catalog.ts'
import { putR2ObjectViaCloudflareApi } from '../lib/r2-api-upload.ts'
import { runIdempotentR2Sync } from '../lib/r2-idempotent-sync.ts'
import { md5Hex } from '../lib/sync-r2-digest.ts'
import {
  listR2ObjectEtags,
  resolveCloudflareApiCredentials,
} from '../lib/sync-logos-r2-remote.ts'
import { HOSTED_LOGO_CACHE_CONTROL, R2_LOGOS_PREFIX } from '../lib/hosted-logos-path.ts'

const execFile = promisify(execFileCb)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const ISOTIPOS_DIR = path.join(REPO_ROOT, 'data/isotipos')
const BUCKET = 'loguitos-assets'

export function parseSyncIsotiposCliArgs(argv: string[]): { dryRun: boolean } {
  return { dryRun: argv.includes('--dry-run') }
}

async function loadRemoteEtagsDefault(): Promise<Map<string, string>> {
  const creds = resolveCloudflareApiCredentials()
  if (!creds) {
    console.warn(
      'sync-isotipos-to-r2: CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN not set; remote etag list empty (more wrangler gets).',
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
    console.log(`sync-isotipos-to-r2: listed ${map.size} remote object etag(s) via API`)
    return map
  } catch (error) {
    console.warn('sync-isotipos-to-r2: R2 list API failed; etag map empty.', error)
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

export type SyncIsotiposResult = {
  uploaded: number
  skipped: number
  errors: number
  refused: number
}

export async function syncIsotiposToR2(options?: {
  dryRun?: boolean
  isotiposDir?: string
}): Promise<SyncIsotiposResult> {
  const catalogSlugs = catalogSlugSetForIsotipoSync()
  const isotiposDir = options?.isotiposDir ?? ISOTIPOS_DIR
  const names = (await readdir(isotiposDir)).filter((name) => name.endsWith('.svg'))

  const entries = []
  let refused = 0

  for (const name of names.sort()) {
    const slug = name.replace(/\.svg$/i, '')
    if (!catalogSlugs.has(slug)) {
      refused += 1
      console.error(`refused ${slug}: not in data/logos-dataset.json hosted slugs`)
      continue
    }
    if (!getIsotipoRecord(slug)) {
      refused += 1
      console.error(`refused ${slug}: missing from filtered isotipo metadata`)
      continue
    }
    const filePath = path.join(isotiposDir, name)
    const bytes = new Uint8Array(await readFile(filePath))
    const objectKey = r2ObjectKeyForIsotipo(slug)
    entries.push({
      objectKey,
      filePath,
      contentType: 'image/svg+xml',
      bytes,
    })
  }

  const creds = resolveCloudflareApiCredentials()
  const result = await runIdempotentR2Sync(
    {
      loadRemoteEtags: loadRemoteEtagsDefault,
      remoteMd5ForKey: remoteMd5ViaWranglerGet,
      putObject: async (ctx) => {
        if (!creds) {
          throw new Error(
            'CLOUDFLARE_ACCOUNT_ID + CLOUDFLARE_API_TOKEN required to upload isotipos with metadata',
          )
        }
        const slug = path.basename(ctx.filePath, '.svg')
        const record = getIsotipoRecord(slug)
        if (!record) {
          throw new Error(`missing metadata for ${slug}`)
        }
        const syncedAt = new Date().toISOString()
        await putR2ObjectViaCloudflareApi({
          accountId: creds.accountId,
          apiToken: creds.apiToken,
          bucket: BUCKET,
          objectKey: ctx.objectKey,
          body: ctx.bytes,
          contentType: ctx.contentType,
          cacheControl: HOSTED_LOGO_CACHE_CONTROL,
          customMetadata: {
            source_url: record.source_url,
            source_type: record.source_type,
            synced_at: syncedAt,
          },
        })
      },
    },
    entries,
    { dryRun: options?.dryRun },
  )

  return { ...result, refused }
}

async function main() {
  const { dryRun } = parseSyncIsotiposCliArgs(process.argv.slice(2))
  const result = await syncIsotiposToR2({ dryRun })
  console.log(
    `sync-isotipos-to-r2: uploaded=${result.uploaded} skipped=${result.skipped} errors=${result.errors} refused=${result.refused}${dryRun ? ' (dry-run)' : ''}`,
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