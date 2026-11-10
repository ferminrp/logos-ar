
import { getAllEntities } from "@/lib/entity-index"
import { getEntityLogoUrl, resolveEntityLogoUrl } from "@/lib/entity-logo"
import { getGoogleFaviconUrl } from "@/lib/favicon-urls"
import {
  measureImage,
  type ImageMetrics,
} from "@/lib/logo-quality/image-metrics"

const KNOWN_DOMAINS = new Set(
  getAllEntities().map((entity) => entity.domain.toLowerCase()),
)
const DOMAIN_PATTERN =
  /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z0-9]([a-z0-9-]*[a-z0-9])?)+$/i
const DEFAULT_SIZE = 256
const MAX_SIZE = 512
const CACHE_CONTROL = "public, max-age=86400, s-maxage=604800, stale-while-revalidate=604800"

type LogoFormat = "png" | "svg"

function parseSize(value: string | null): number {
  if (!value) return DEFAULT_SIZE

  const parsed = Number.parseInt(value, 10)
  if (Number.isNaN(parsed) || parsed <= 0) return DEFAULT_SIZE

  return Math.min(parsed, MAX_SIZE)
}

function normalizeDomain(value: string | null): string | null {
  const domain = value?.trim().toLowerCase() ?? ""
  if (!domain || !DOMAIN_PATTERN.test(domain) || !KNOWN_DOMAINS.has(domain)) {
    return null
  }

  return domain
}

function getFilename(domain: string, format: LogoFormat): string {
  return `${domain.replace(/\./g, "_")}_logo.${format}`
}

function contentTypeForFormat(format: ImageMetrics["format"]): string {
  switch (format) {
    case "png":
      return "image/png"
    case "jpeg":
      return "image/jpeg"
    case "gif":
      return "image/gif"
    case "webp":
      return "image/webp"
    case "svg":
      return "image/svg+xml"
    case "ico":
      return "image/x-icon"
    default:
      return "application/octet-stream"
  }
}

function embedMimeType(
  upstreamContentType: string | null,
  detectedFormat: ImageMetrics["format"],
): string {
  const upstreamMime = upstreamContentType?.split(";")[0]?.trim()
  const candidate =
    upstreamMime || contentTypeForFormat(detectedFormat)
  return candidate.startsWith("image/")
    ? candidate
    : contentTypeForFormat(detectedFormat)
}

function extractLargestIcoImage(bytes: Uint8Array): Uint8Array | null {
  if (bytes.length < 6 || bytes[0] !== 0 || bytes[1] !== 0) {
    return null
  }

  const count = bytes[4]! | (bytes[5]! << 8)
  if (count === 0 || count > 256) {
    return null
  }

  let best: { pixels: number; offset: number; length: number } | null = null

  for (let i = 0; i < count; i++) {
    const entryOffset = 6 + i * 16
    if (entryOffset + 16 > bytes.length) {
      return null
    }

    const width = bytes[entryOffset]! === 0 ? 256 : bytes[entryOffset]!
    const height = bytes[entryOffset + 1]! === 0 ? 256 : bytes[entryOffset + 1]!
    const imageLength =
      bytes[entryOffset + 8]! |
      (bytes[entryOffset + 9]! << 8) |
      (bytes[entryOffset + 10]! << 16) |
      (bytes[entryOffset + 11]! << 24)
    const imageOffset =
      bytes[entryOffset + 12]! |
      (bytes[entryOffset + 13]! << 8) |
      (bytes[entryOffset + 14]! << 16) |
      (bytes[entryOffset + 15]! << 24)

    if (
      imageLength <= 0 ||
      imageOffset < 0 ||
      imageOffset + imageLength > bytes.length
    ) {
      continue
    }

    const pixels = width * height
    if (!best || pixels > best.pixels) {
      best = { pixels, offset: imageOffset, length: imageLength }
    }
  }

  if (!best) {
    return null
  }

  return bytes.slice(best.offset, best.offset + best.length)
}

function getPngConversionSource(
  logoBuffer: ArrayBuffer,
  bytes: Uint8Array,
  imageMetrics: ImageMetrics,
): { source: ArrayBuffer; format: ImageMetrics["format"] } {
  if (imageMetrics.format !== "ico") {
    return { source: logoBuffer, format: imageMetrics.format }
  }

  const extracted = extractLargestIcoImage(bytes)
  if (!extracted) {
    return { source: logoBuffer, format: "ico" }
  }

  const extractedMetrics = measureImage(extracted)
  const format =
    extractedMetrics.format === "unknown" ? "png" : extractedMetrics.format

  return {
    // Copy into a fresh Uint8Array so the backing store is a plain ArrayBuffer.
    source: new Uint8Array(extracted).buffer,
    format,
  }
}

function buildSvgFromRaster(
  rasterBuffer: ArrayBuffer,
  size: number,
  mimeType: string,
): string {
  const bytes = new Uint8Array(rasterBuffer)
  let binary = ''
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]!)
  }
  const base64 = btoa(binary)

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image width="${size}" height="${size}" xlink:href="data:${mimeType};base64,${base64}" />
</svg>`
}

export async function handleLogoDownloadGet(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = normalizeDomain(searchParams.get("domain"))
  const format = searchParams.get("format")?.toLowerCase()
  const size = parseSize(searchParams.get("size"))

  if (!domain) {
    return Response.json({ error: "Dominio inválido" }, { status: 400 })
  }

  if (format !== "png" && format !== "svg") {
    return Response.json({ error: "Formato inválido" }, { status: 400 })
  }

  const entity = getAllEntities().find(
    (item) => item.domain.toLowerCase() === domain,
  )
  const logoUrl = entity
    ? getEntityLogoUrl(entity, size)
    : getGoogleFaviconUrl(domain, size)
  const faviconUrl = resolveEntityLogoUrl(logoUrl, request.url)
  const upstream = await fetch(faviconUrl, {
    headers: {
      "User-Agent": "LogosArgentina/1.0",
    },
    
  })

  if (!upstream.ok) {
    return Response.json(
      { error: "No se pudo obtener el logo" },
      { status: upstream.status === 404 ? 404 : 502 },
    )
  }

  const logoBuffer = await upstream.arrayBuffer()
  const filename = getFilename(domain, format)
  const bytes = new Uint8Array(logoBuffer)
  const imageMetrics = measureImage(bytes)
  const upstreamContentType = upstream.headers.get("content-type")
  const rasterMime = embedMimeType(upstreamContentType, imageMetrics.format)

  if (format === "png") {
    let pngBody: ArrayBuffer | Uint8Array<ArrayBuffer> = logoBuffer
    if (imageMetrics.format !== "png") {
      const { format: sourceFormat } = getPngConversionSource(
        logoBuffer,
        bytes,
        imageMetrics,
      )

      if (sourceFormat === 'ico' || sourceFormat === 'jpeg' || sourceFormat === 'webp' || sourceFormat === 'gif') {
        pngBody = logoBuffer
      } else {
        return Response.json(
          { error: 'No se pudo convertir el logo' },
          { status: 502 },
        )
      }
    }

    return new Response(pngBody, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": CACHE_CONTROL,
      },
    })
  }

  if (imageMetrics.format === "svg") {
    const svgText = new TextDecoder("utf-8").decode(bytes)
    return new Response(svgText, {
      headers: {
        "Content-Type": "image/svg+xml",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": CACHE_CONTROL,
      },
    })
  }

  const svg = buildSvgFromRaster(logoBuffer, size, rasterMime)

  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": CACHE_CONTROL,
    },
  })
}
