"use client"

import { Settings } from "lucide-react"
import { useConfig } from "@/lib/config-context"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

const sizes = [16, 32, 64, 128, 256] as const

export function ConfigPanel() {
  const { config, updateConfig } = useConfig()

  return (
    <div className="rounded-lg border border-border bg-card p-4">
      <div className="flex items-center gap-2 mb-4">
        <Settings className="h-4 w-4 text-primary" />
        <h3 className="font-medium text-foreground">Configurar parámetros</h3>
      </div>

      <div className="flex flex-wrap items-center gap-6">
        {/* Size selector */}
        <div className="flex items-center gap-3">
          <Label htmlFor="size" className="text-sm text-muted-foreground whitespace-nowrap">
            Tamaño (px)
          </Label>
          <Select
            value={String(config.size)}
            onValueChange={(value) => updateConfig({ size: Number(value) })}
          >
            <SelectTrigger id="size" className="w-24">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {sizes.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Output format selector */}
        <div className="flex items-center gap-3">
          <Label htmlFor="format" className="text-sm text-muted-foreground whitespace-nowrap">
            Extensión archivo
          </Label>
          <Select
            value={config.outputFormat}
            onValueChange={(value) =>
              updateConfig({ outputFormat: value as "png" | "ico" | "original" })
            }
          >
            <SelectTrigger id="format" className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="original">Original</SelectItem>
              <SelectItem value="png">.png</SelectItem>
              <SelectItem value="ico">.ico</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Include headers toggle */}
        <div className="flex items-center gap-3">
          <Label htmlFor="headers" className="text-sm text-muted-foreground whitespace-nowrap">
            Incluir -I (headers)
          </Label>
          <Switch
            id="headers"
            checked={config.includeHeaders}
            onCheckedChange={(checked) => updateConfig({ includeHeaders: checked })}
          />
        </div>
      </div>

      {/* Preview */}
      <div className="mt-4 rounded bg-secondary p-2">
        <p className="text-xs text-muted-foreground mb-1">Vista previa del curl:</p>
        <code className="text-xs font-mono text-foreground break-all">
          curl{config.includeHeaders ? " -I" : ""} &quot;https://s2.googleusercontent.com/s2/favicons?domain=ejemplo.com&sz={config.size}&quot; -o ejemplo_com_favicon.{config.outputFormat === "original" ? "png" : config.outputFormat}
        </code>
      </div>
    </div>
  )
}
