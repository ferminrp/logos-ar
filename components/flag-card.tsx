"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import type { Flag } from "@/lib/flags-data"
import { getFlagImgSnippet, getFlagSvgUrl, type FlagRatio } from "@/lib/flag-urls"

interface FlagCardProps {
  flag: Flag
  ratio?: FlagRatio
}

export function FlagCard({ flag, ratio = "3x2" }: FlagCardProps) {
  const [copiedField, setCopiedField] = useState<string | null>(null)

  const copyToClipboard = async (text: string, field: string) => {
    await navigator.clipboard.writeText(text)
    setCopiedField(field)
    setTimeout(() => setCopiedField(null), 2000)
  }

  const svgUrl = getFlagSvgUrl(flag.code, ratio)
  const imgSnippet = getFlagImgSnippet(flag.code, flag.name, ratio)

  return (
    <div className="group relative rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="flex items-start gap-4">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ${
            ratio === "1x1" ? "h-14 w-14" : "h-14 w-[4.25rem]"
          }`}
        >
          <img
            src={svgUrl}
            alt={`Bandera de ${flag.name}`}
            width={ratio === "1x1" ? 40 : 48}
            height={ratio === "1x1" ? 40 : 32}
            className={
              ratio === "1x1"
                ? "h-10 w-10 object-cover"
                : "h-8 w-12 object-cover"
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{flag.name}</h3>
          <p className="font-mono text-sm text-muted-foreground">{flag.code}</p>
        </div>
      </div>

      <div className="mt-4 space-y-2">
        <TooltipProvider delayDuration={0}>
          <div className="flex items-center gap-2">
            <code className="flex-1 truncate rounded bg-secondary px-2 py-1.5 font-mono text-xs text-muted-foreground">
              SVG ({ratio})
            </code>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0"
                  onClick={() => copyToClipboard(svgUrl, "svg-url")}
                >
                  {copiedField === "svg-url" ? (
                    <Check className="h-4 w-4 text-primary" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                  <span className="sr-only">Copiar URL del SVG</span>
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
                  onClick={() => copyToClipboard(imgSnippet, "img-snippet")}
                >
                  {copiedField === "img-snippet" ? (
                    <Check className="mr-1 h-3 w-3 text-primary" />
                  ) : null}
                  img
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top">
                <p>Copiar snippet HTML</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </TooltipProvider>
      </div>
    </div>
  )
}
