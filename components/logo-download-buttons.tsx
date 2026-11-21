import { Download } from "lucide-react"
import { Button } from "@/components/ui/button"
import { CopyButton } from "@/components/copy-button"

type LogoFormat = "png" | "svg" | "isotipo"

interface LogoDownloadButtonsProps {
  slug: string
  name: string
  domain: string
  layout?: "hero" | "full"
  /** True only when the catalog hosts a real vector for this logo. */
  hasVector?: boolean
  isotipoSvgUrl?: string
}

function getDownloadUrl(domain: string, format: LogoFormat): string {
  const params = new URLSearchParams({ domain, format, size: "256" })
  return `/api/logo-download?${params.toString()}`
}

const FORMAT_LABEL: Record<LogoFormat, string> = {
  png: "Descargar PNG",
  svg: "Descargar SVG",
  isotipo: "Descargar isotipo SVG",
}

/**
 * Plain download links: the API answers with `Content-Disposition: attachment`,
 * so they work without JavaScript. The delegated script in BaseLayout reports
 * `[data-logo-download]` clicks to analytics.
 */
export function LogoDownloadButtons({
  slug,
  name,
  domain,
  layout = "full",
  hasVector = false,
  isotipoSvgUrl,
}: LogoDownloadButtonsProps) {
  const formats: LogoFormat[] = [
    "png",
    ...(hasVector ? (["svg"] as const) : []),
    ...(isotipoSvgUrl ? (["isotipo"] as const) : []),
  ]

  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {formats.map((format) => (
          <Button
            key={format}
            asChild
            variant={
              format === "png" && layout === "hero" ? "logo-download-png" : "outline"
            }
            size="touch"
          >
            <a
              href={getDownloadUrl(domain, format)}
              download
              rel="nofollow"
              data-logo-download={format}
              data-logo-slug={slug}
              data-logo-name={name}
            >
              <Download className="h-4 w-4" aria-hidden />
              {FORMAT_LABEL[format]}
            </a>
          </Button>
        ))}
      </div>
      {isotipoSvgUrl ? (
        <div>
          <p className="mb-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
            URL del isotipo SVG
          </p>
          <div className="flex items-center gap-2">
            <code className="max-w-full flex-1 break-all rounded bg-secondary px-2 py-1.5 font-mono text-xs text-foreground">
              {isotipoSvgUrl}
            </code>
            <CopyButton
              value={isotipoSvgUrl}
              size="touch"
              label="Copiar URL del isotipo SVG"
            />
          </div>
        </div>
      ) : null}
    </div>
  )
}
