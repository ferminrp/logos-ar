export type ImageMetrics = {
  width: number
  height: number
  format: "png" | "jpeg" | "gif" | "webp" | "svg" | "ico" | "unknown"
}

function readUInt32BE(buffer: Uint8Array, offset: number): number {
  return (
    (buffer[offset]! << 24) |
    (buffer[offset + 1]! << 16) |
    (buffer[offset + 2]! << 8) |
    buffer[offset + 3]!
  )
}

export function measureImage(bytes: Uint8Array): ImageMetrics {
  if (bytes.length >= 8 && bytes[0] === 0x89 && bytes[1] === 0x50) {
    const width = readUInt32BE(bytes, 16)
    const height = readUInt32BE(bytes, 20)
    return { width, height, format: "png" }
  }

  if (bytes.length >= 4 && bytes[0] === 0xff && bytes[1] === 0xd8) {
    let offset = 2
    while (offset + 9 < bytes.length) {
      if (bytes[offset] !== 0xff) break
      const marker = bytes[offset + 1]!
      const length = (bytes[offset + 2]! << 8) | bytes[offset + 3]!
      if (marker >= 0xc0 && marker <= 0xcf && marker !== 0xc4 && marker !== 0xc8) {
        const height = (bytes[offset + 5]! << 8) | bytes[offset + 6]!
        const width = (bytes[offset + 7]! << 8) | bytes[offset + 8]!
        return { width, height, format: "jpeg" }
      }
      offset += 2 + length
    }
    return { width: 0, height: 0, format: "jpeg" }
  }

  if (
    bytes.length >= 6 &&
    bytes[0] === 0x47 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46
  ) {
    const width = bytes[6]! | (bytes[7]! << 8)
    const height = bytes[8]! | (bytes[9]! << 8)
    return { width, height, format: "gif" }
  }

  if (
    bytes.length >= 30 &&
    bytes[0] === 0x52 &&
    bytes[1] === 0x49 &&
    bytes[2] === 0x46 &&
    bytes[3] === 0x46 &&
    bytes[8] === 0x57 &&
    bytes[9] === 0x45 &&
    bytes[10] === 0x42 &&
    bytes[11] === 0x50
  ) {
    let offset = 12
    while (offset + 8 <= bytes.length) {
      const chunkSize =
        bytes[offset + 4]! |
        (bytes[offset + 5]! << 8) |
        (bytes[offset + 6]! << 16) |
        (bytes[offset + 7]! << 24)
      const type = String.fromCharCode(
        bytes[offset]!,
        bytes[offset + 1]!,
        bytes[offset + 2]!,
        bytes[offset + 3]!,
      )
      if (type === "VP8 ") {
        const width = (bytes[offset + 14]! | (bytes[offset + 15]! << 8)) & 0x3fff
        const height = (bytes[offset + 16]! | (bytes[offset + 17]! << 8)) & 0x3fff
        return { width, height, format: "webp" }
      }
      if (type === "VP8L" && offset + 25 <= bytes.length) {
        const bits =
          bytes[offset + 9]! |
          (bytes[offset + 10]! << 8) |
          (bytes[offset + 11]! << 16) |
          (bytes[offset + 12]! << 24)
        const width = (bits & 0x3fff) + 1
        const height = ((bits >> 14) & 0x3fff) + 1
        return { width, height, format: "webp" }
      }
      offset += 8 + chunkSize + (chunkSize % 2)
    }
    return { width: 0, height: 0, format: "webp" }
  }

  if (bytes.length >= 6 && bytes[0] === 0 && bytes[1] === 0) {
    const count = bytes[4]! | (bytes[5]! << 8)
    let best = 0
    for (let i = 0; i < count; i++) {
      const offset = 6 + i * 16
      if (offset + 16 > bytes.length) break
      const w = bytes[offset]! === 0 ? 256 : bytes[offset]!
      const h = bytes[offset + 1]! === 0 ? 256 : bytes[offset + 1]!
      best = Math.max(best, w, h)
    }
    if (best > 0) {
      return { width: best, height: best, format: "ico" }
    }
  }

  const text = new TextDecoder("utf-8", { fatal: false }).decode(bytes.slice(0, 4096))
  if (text.includes("<svg")) {
    const viewBox = text.match(/viewBox=["']([^"']+)["']/i)
    if (viewBox) {
      const parts = viewBox[1]!.trim().split(/\s+/).map(Number)
      if (parts.length === 4 && parts.every((n) => Number.isFinite(n))) {
        return { width: Math.round(parts[2]), height: Math.round(parts[3]), format: "svg" }
      }
    }
    const widthMatch = text.match(/\bwidth=["'](\d+)/i)
    const heightMatch = text.match(/\bheight=["'](\d+)/i)
    const width = widthMatch ? Number.parseInt(widthMatch[1]!, 10) : 128
    const height = heightMatch ? Number.parseInt(heightMatch[1]!, 10) : 128
    return { width, height, format: "svg" }
  }

  return { width: 0, height: 0, format: "unknown" }
}
