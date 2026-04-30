"use client"

import { useState } from "react"
import { Check, Copy, ExternalLink } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { type Entity } from "@/lib/logos-data"
import {
  useConfig,
  getGoogleFaviconUrl,
  getDuckDuckGoFaviconUrl,
  getGoogleCurl,
  getDuckDuckGoCurl,
} from "@/lib/config-context"

interface LogoCardProps {
  entity: Entity
}

export function LogoCard({ entity }: LogoCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)
  const [imageError, setImageError] = useState(false)
  const { config } = useConfig()

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const googleUrl = getGoogleFaviconUrl(entity.domain, config.size)
  const duckUrl = getDuckDuckGoFaviconUrl(entity.domain)
  const googleCurl = getGoogleCurl(entity.domain, config)
  const duckCurl = getDuckDuckGoCurl(entity.domain, config)

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="flex items-start gap-4">
        {/* Logo */}
        <div className="flex h-14 w-14 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary">
          {!imageError ? (
            <img
              src={googleUrl}
              alt={`Logo de ${entity.name}`}
              className="h-10 w-10 object-contain"
              onError={() => setImageError(true)}
              referrerPolicy="no-referrer"
            />
          ) : (
            <img
              src={duckUrl}
              alt={`Logo de ${entity.name}`}
              className="h-10 w-10 object-contain"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.target as HTMLImageElement
                target.style.display = "none"
                target.parentElement!.innerHTML = `<span class="text-xl font-bold text-muted-foreground">${entity.name.charAt(0)}</span>`
              }}
            />
          )}
        </div>

        {/* Info */}
        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{entity.name}</h3>
          <a
            href={`https://${entity.domain}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1 text-sm text-muted-foreground transition-colors hover:text-primary"
          >
            {entity.domain}
            <ExternalLink className="h-3 w-3" />
          </a>
        </div>
      </div>

      {/* Copy buttons */}
      <div className="mt-4 space-y-2">
        <TooltipProvider delayDuration={0}>
          {/* Google API */}
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-secondary px-2 py-1.5 font-mono text-xs text-muted-foreground">
              Google ({config.size}px)
            </code>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(googleUrl, "google-url")}
                >
                  {copiedField === "google-url" ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copiar URL de Google</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copiar URL</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 font-mono text-xs"
                  onClick={() => copyToClipboard(googleCurl, "google-curl")}
                >
                  {copiedField === "google-curl" ? (
                    <Check className="mr-1 h-3 w-3 text-primary" />
                  ) : null}
                  curl
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copiar comando curl</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* DuckDuckGo API */}
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-secondary px-2 py-1.5 font-mono text-xs text-muted-foreground">
              DuckDuckGo
            </code>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(duckUrl, "duck-url")}
                >
                  {copiedField === "duck-url" ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copiar URL de DuckDuckGo</span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copiar URL</p>
              </TooltipContent>
            </Tooltip>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-8 px-2 font-mono text-xs"
                  onClick={() => copyToClipboard(duckCurl, "duck-curl")}
                >
                  {copiedField === "duck-curl" ? (
                    <Check className="mr-1 h-3 w-3 text-primary" />
                  ) : null}
                  curl
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copiar comando curl</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
