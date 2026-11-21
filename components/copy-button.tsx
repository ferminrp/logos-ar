import type { ReactNode } from "react"
import { Check, Copy } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"

interface CopyButtonProps {
  value: string
  label?: string
  variant?: "ghost" | "outline"
  size?: "sm" | "default" | "touch"
  className?: string
  iconClassName?: string
  /** Visible text. Without it the button is icon-only and `label` names it. */
  children?: ReactNode
}

/**
 * Static markup: the click is handled by the delegated `[data-copy]` script in
 * BaseLayout, so it works in prerendered pages without hydrating React.
 */
export function CopyButton({
  value,
  label = "Copiar",
  variant = "ghost",
  size = "sm",
  className,
  iconClassName = "h-4 w-4",
  children,
}: CopyButtonProps) {
  return (
    <Button
      type="button"
      variant={variant}
      size={size}
      className={className}
      data-copy={value}
      aria-label={children ? undefined : label}
    >
      <Copy className={cn("copy-icon-idle shrink-0", iconClassName)} aria-hidden />
      <Check
        className={cn("copy-icon-done shrink-0 text-primary", iconClassName)}
        aria-hidden
      />
      {children}
    </Button>
  )
}
