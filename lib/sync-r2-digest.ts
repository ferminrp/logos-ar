import { createHash } from 'node:crypto'

export function md5Hex(bytes: Uint8Array): string {
  return createHash('md5').update(bytes).digest('hex')
}