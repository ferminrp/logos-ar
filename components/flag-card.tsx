"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
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
    <div className="group relative min-w-0 rounded-lg border border-border bg-card p-4 transition-all hover:border-primary/50 hover:bg-card/80">
      <div className="flex items-start gap-3">
        <div
          className={`flex shrink-0 items-center justify-center overflow-hidden rounded-lg bg-secondary ${
            ratio === "1x1" ? "h-12 w-12" : "h-12 w-[4.5rem]"
          }`}
        >
          <img
            src={svgUrl}
            alt={`Bandera de ${flag.name}`}
            width={ratio === "1x1" ? 40 : 48}
            height={ratio === "1x1" ? 40 : 32}
            className={
              ratio === "1x1"
                ? "h-9 w-9 object-cover"
                : "h-8 w-12 object-cover"
            }
          />
        </div>

        <div className="min-w-0 flex-1">
          <h3 className="truncate font-medium text-foreground">{flag.name}</h3>
          <p className="font-mono text-sm text-muted-foreground">{flag.code}</p>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 min-w-0 px-2 text-xs"
          onClick={() => copyToClipboard(svgUrl, "svg-url")}
        >
          {copiedField === "svg-url" ? (
            <Check className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">Copiar URL</span>
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="h-9 min-w-0 px-2 text-xs"
          onClick={() => copyToClipboard(imgSnippet, "img-snippet")}
        >
          {copiedField === "img-snippet" ? (
            <Check className="mr-1.5 h-3.5 w-3.5 shrink-0 text-primary" />
          ) : (
            <Copy className="mr-1.5 h-3.5 w-3.5 shrink-0" />
          )}
          <span className="truncate">Copiar HTML</span>
        </Button>
      </div>
    </div>
  )
}
