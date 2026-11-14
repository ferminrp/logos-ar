"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { API_DOCS_MARKDOWN } from "@/lib/api-docs-markdown"
import { cn } from "@/lib/utils"

export function DocsCopyMarkdownButton() {
  const [copied, setCopied] = useState(false)

  const handleCopy = async () => {
    await navigator.clipboard.writeText(API_DOCS_MARKDOWN)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <Button
      type="button"
      variant="outline"
      size="sm"
      className="rounded-xl"
      onClick={handleCopy}
    >
      {copied ? (
        <Check className="icon-enter h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {/* Both labels share one grid cell so the button keeps the longer label's width. */}
      <span className="grid">
        <span
          className={cn("col-start-1 row-start-1", copied && "invisible")}
          aria-hidden={copied}
        >
          Copiar como Markdown
        </span>
        <span
          className={cn("col-start-1 row-start-1", !copied && "invisible")}
          aria-hidden={!copied}
        >
          Copiado
        </span>
      </span>
    </Button>
  )
}
