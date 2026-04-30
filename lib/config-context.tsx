"use client"

import { createContext, useContext, useState, type ReactNode } from "react"

export interface CurlConfig {
  size: number
  outputFormat: "png" | "ico" | "original"
  includeHeaders: boolean
}

interface ConfigContextType {
  config: CurlConfig
  setConfig: (config: CurlConfig) => void
  updateConfig: (partial: Partial<CurlConfig>) => void
}

const defaultConfig: CurlConfig = {
  size: 128,
  outputFormat: "original",
  includeHeaders: false,
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CurlConfig>(defaultConfig)

  const updateConfig = (partial: Partial<CurlConfig>) => {
    setConfig((prev) => ({ ...prev, ...partial }))
  }

  return (
    <ConfigContext.Provider value={{ config, setConfig, updateConfig }}>
      {children}
    </ConfigContext.Provider>
  )
}

export function useConfig() {
  const context = useContext(ConfigContext)
  if (!context) {
    throw new Error("useConfig must be used within a ConfigProvider")
  }
  return context
}

// Helper functions that use the config
export function getGoogleFaviconUrl(domain: string, size: number): string {
  return `https://s2.googleusercontent.com/s2/favicons?domain=${domain}&sz=${size}`
}

export function getDuckDuckGoFaviconUrl(domain: string): string {
  return `https://icons.duckduckgo.com/ip3/${domain}.ico`
}

export function getGoogleCurl(domain: string, config: CurlConfig): string {
  const url = getGoogleFaviconUrl(domain, config.size)
  const ext = config.outputFormat === "original" ? "png" : config.outputFormat
  const filename = `${domain.replace(/\./g, "_")}_favicon.${ext}`
  const headers = config.includeHeaders ? " -I" : ""
  return `curl${headers} "${url}" -o ${filename}`
}

export function getDuckDuckGoCurl(domain: string, config: CurlConfig): string {
  const url = getDuckDuckGoFaviconUrl(domain)
  const ext = config.outputFormat === "original" ? "ico" : config.outputFormat
  const filename = `${domain.replace(/\./g, "_")}_favicon.${ext}`
  const headers = config.includeHeaders ? " -I" : ""
  return `curl${headers} "${url}" -o ${filename}`
}
