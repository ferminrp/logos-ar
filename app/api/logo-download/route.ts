import { NextResponse } from "next/server"
import { getAllEntities } from "@/lib/entity-index"
import { getGoogleFaviconUrl } from "@/lib/favicon-urls"

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

function buildSvgFromPng(pngBuffer: ArrayBuffer, size: number): string {
  const base64 = Buffer.from(pngBuffer).toString("base64")

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}">
  <image width="${size}" height="${size}" xlink:href="data:image/png;base64,${base64}" />
</svg>`
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const domain = normalizeDomain(searchParams.get("domain"))
  const format = searchParams.get("format")?.toLowerCase()
  const size = parseSize(searchParams.get("size"))

  if (!domain) {
    return NextResponse.json({ error: "Dominio inválido" }, { status: 400 })
  }

  if (format !== "png" && format !== "svg") {
    return NextResponse.json({ error: "Formato inválido" }, { status: 400 })
  }

  const faviconUrl = getGoogleFaviconUrl(domain, size)
  const upstream = await fetch(faviconUrl, {
    headers: {
      "User-Agent": "LogosArgentina/1.0",
    },
    next: { revalidate: 86400 },
  })

  if (!upstream.ok) {
    return NextResponse.json(
      { error: "No se pudo obtener el logo" },
      { status: upstream.status === 404 ? 404 : 502 },
    )
  }

  const pngBuffer = await upstream.arrayBuffer()
  const filename = getFilename(domain, format)

  if (format === "png") {
    return new NextResponse(pngBuffer, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="${filename}"`,
        "Cache-Control": CACHE_CONTROL,
      },
    })
  }

  const svg = buildSvgFromPng(pngBuffer, size)

  return new NextResponse(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
      "Content-Disposition": `attachment; filename="${filename}"`,
      "Cache-Control": CACHE_CONTROL,
    },
  })
}
