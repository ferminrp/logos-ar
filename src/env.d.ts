/// <reference types="astro/client" />

declare module 'cloudflare:workers' {
  export const env: {
    ASSETS: {
      fetch: (request: Request | string | URL) => Promise<Response>
    }
  }
}

declare module '*.wasm' {
  const wasm: ArrayBuffer
  export default wasm
}
