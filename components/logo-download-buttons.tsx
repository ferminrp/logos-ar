"use client"

import { useState } from "react"
import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"

type LogoFormat = "png" | "svg"

interface LogoDownloadButtonsProps {
  slug: string
  name: string
  domain: string
}

function trackLogoDownload(slug: string, name: string, format: LogoFormat) {
  if (typeof window !== "undefined" && typeof window.gtag === "function") {
    window.gtag("event", "logo_download", {
      logo_slug: slug,
      logo_name: name,
      format,
    })
  }
}

function getDownloadUrl(domain: string, format: LogoFormat): string {
  const params = new URLSearchParams({
    domain,
    format,
    size: "256",
  })

  return `/api/logo-download?${params.toString()}`
}

function getFilename(domain: string, format: LogoFormat): string {
  const base = domain.replace(/\./g, "_")
  return `${base}_logo.${format}`
}

async function triggerDownload(url: string, filename: string) {
  const response = await fetch(url)

  if (!response.ok) {
    throw new Error("download_failed")
  }

  const blob = await response.blob()
  const objectUrl = URL.createObjectURL(blob)
  const anchor = document.createElement("a")
  anchor.href = objectUrl
  anchor.download = filename
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
  URL.revokeObjectURL(objectUrl)
}

export function LogoDownloadButtons({
  slug,
  name,
  domain,
}: LogoDownloadButtonsProps) {
  const [downloadingFormat, setDownloadingFormat] = useState<LogoFormat | null>(
    null,
  )
  const [error, setError] = useState<string | null>(null)

  async function handleDownload(format: LogoFormat) {
    setDownloadingFormat(format)
    setError(null)
    trackLogoDownload(slug, name, format)

    try {
      await triggerDownload(
        getDownloadUrl(domain, format),
        getFilename(domain, format),
      )
    } catch {
      setError("No se pudo descargar el logo. Intentá de nuevo.")
    } finally {
      setDownloadingFormat(null)
    }
  }

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          disabled={downloadingFormat !== null}
          onClick={() => void handleDownload("png")}
        >
          <Download className="h-4 w-4" />
          {downloadingFormat === "png" ? "Descargando..." : "Descargar PNG"}
        </Button>
        <Button
          type="button"
          variant="outline"
          disabled={downloadingFormat !== null}
          onClick={() => void handleDownload("svg")}
        >
          <Download className="h-4 w-4" />
          {downloadingFormat === "svg" ? "Descargando..." : "Descargar SVG"}
        </Button>
      </div>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
