"use client"

import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { getGoogleFaviconUrl } from "@/lib/favicon-urls"

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

function triggerDownload(url: string, filename: string) {
  const anchor = document.createElement("a")
  anchor.href = url
  anchor.download = filename
  anchor.target = "_blank"
  anchor.rel = "noopener noreferrer"
  document.body.appendChild(anchor)
  anchor.click()
  document.body.removeChild(anchor)
}

function getFilename(domain: string, format: LogoFormat): string {
  const base = domain.replace(/\./g, "_")
  return `${base}_logo.${format}`
}

export function LogoDownloadButtons({
  slug,
  name,
  domain,
}: LogoDownloadButtonsProps) {
  const pngUrl = getGoogleFaviconUrl(domain, 256)

  function handleDownload(format: LogoFormat) {
    trackLogoDownload(slug, name, format)
    triggerDownload(pngUrl, getFilename(domain, format))
  }

  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" onClick={() => handleDownload("png")}>
        <Download className="h-4 w-4" />
        Descargar PNG
      </Button>
      <Button
        type="button"
        variant="outline"
        onClick={() => handleDownload("svg")}
      >
        <Download className="h-4 w-4" />
        Descargar SVG
      </Button>
    </div>
  )
}

