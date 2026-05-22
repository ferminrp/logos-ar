"use client"

import { createContext, useContext, useState, type ReactNode } from "react"
import {
  type CurlConfig,
  defaultCurlConfig,
  getGoogleFaviconUrl,
  getDuckDuckGoFaviconUrl,
  getGoogleCurl,
  getDuckDuckGoCurl,
} from "@/lib/favicon-urls"

export type { CurlConfig } from "@/lib/favicon-urls"

interface ConfigContextType {
  config: CurlConfig
  setConfig: (config: CurlConfig) => void
  updateConfig: (partial: Partial<CurlConfig>) => void
}

const ConfigContext = createContext<ConfigContextType | undefined>(undefined)

export function ConfigProvider({ children }: { children: ReactNode }) {
  const [config, setConfig] = useState<CurlConfig>(defaultCurlConfig)

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

export { getGoogleFaviconUrl, getDuckDuckGoFaviconUrl, getGoogleCurl, getDuckDuckGoCurl }
