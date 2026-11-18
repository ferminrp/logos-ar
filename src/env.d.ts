/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: {
    ASSETS: {
      fetch: (request: Request | string | URL) => Promise<Response>
    }
    GA4_API_SECRET?: string
  }
}

declare namespace App {
  interface Locals {
    cfContext?: ExecutionContext
  }
}

declare module '*.wasm' {
  const wasm: ArrayBuffer
  export default wasm
}
