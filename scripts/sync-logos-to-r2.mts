/**
 * Upload hosted catalog logos from public/logos/ to R2 (loguitos-assets).
 *
 * Keys: loguitos.app/logos/<slug>/logo.png|.svg
 * Skips objects whose MD5 already matches the remote etag (idempotent).
 *
 * Requires wrangler auth with access to bucket `loguitos-assets`.
 */
import { createHash } from 'node:crypto'
import { readdir, readFile } from 'node:fs/promises'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFile as execFileCb } from 'node:child_process'
import { promisify } from 'node:util'
import {
  HOSTED_LOGO_CACHE_CONTROL,
  r2ObjectKeyForHostedLogo,
  type HostedLogoExtension,
} from '../lib/worker-logos-r2.ts'

const execFile = promisify(execFileCb)

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const REPO_ROOT = path.resolve(__dirname, '..')
const LOGOS_DIR = path.join(REPO_ROOT, 'public/logos')
const BUCKET = 'loguitos-assets'

export function md5Hex(bytes: Uint8Array): string {
  return createHash('md5').update(bytes).digest('hex')
}

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

async function wranglerHeadObject(objectKey: string): Promise<string | null> {
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
        '--remote',
        '--pipe',
      ],
      { cwd: REPO_ROOT, encoding: 'buffer', maxBuffer: 16 * 1024 * 1024 },
    )
    return md5Hex(new Uint8Array(stdout))
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

export type SyncLogosResult = {
  uploaded: number
  skipped: number
  errors: number
}

export async function syncLogosToR2(logosDir = LOGOS_DIR): Promise<SyncLogosResult> {
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
    const remoteEtag = await wranglerHeadObject(key)
    if (remoteEtag && remoteEtag === digest) {
      skipped += 1
      continue
    }

    const contentType = ext === 'png' ? 'image/png' : 'image/svg+xml'
    try {
      await wranglerPutObject(key, filePath, contentType)
      uploaded += 1
      console.log(`uploaded ${key}`)
    } catch (error) {
      errors += 1
      console.error(`failed ${key}:`, error)
    }
  }

  return { uploaded, skipped, errors }
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