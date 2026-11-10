/// <reference types="astro/client" />

declare module '*.wasm' {
  const wasm: ArrayBuffer
  export default wasm
}
