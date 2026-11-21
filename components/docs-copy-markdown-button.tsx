import { CopyButton } from "@/components/copy-button"
import { API_DOCS_MARKDOWN } from "@/lib/api-docs-markdown"

export function DocsCopyMarkdownButton() {
  return (
    <CopyButton value={API_DOCS_MARKDOWN} variant="outline" className="rounded-xl">
      Copiar como Markdown
    </CopyButton>
  )
}
