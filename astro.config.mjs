import cloudflare from '@astrojs/cloudflare'
import react from '@astrojs/react'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'
import path from 'node:path'
import { fileURLToPath } from 'node:url'
import wasm from 'vite-plugin-wasm'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

export default defineConfig({
  output: 'server',
  session: {
    driver: 'memory',
  },
  adapter: cloudflare({
    imageService: 'passthrough',
    sessionKVBindingName: undefined,
  }),
  integrations: [react()],
  vite: {
    plugins: [tailwindcss(), wasm()],
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
  },
  prefetch: false,
  trailingSlash: 'never',
  build: {
    format: 'file',
  },
  server: {
    port: 4321,
  },
})
