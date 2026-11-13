/// <reference types="vite/client" />

interface ImportMetaEnv {
  /** Absolute API origin for deployed builds (e.g. https://api.example.com). Empty in dev (Vite proxy). */
  readonly VITE_API_BASE_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
