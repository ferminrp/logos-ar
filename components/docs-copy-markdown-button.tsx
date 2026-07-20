"use client"

import { useState } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { API_DOCS_MARKDOWN } from "@/lib/api-docs-markdown"

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
        <Check className="h-4 w-4 text-primary" />
      ) : (
        <Copy className="h-4 w-4" />
      )}
      {copied ? "Copiado" : "Copiar como Markdown"}
    </Button>
  )
}
