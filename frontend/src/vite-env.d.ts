/// <reference types="vite/client" />

interface ImportMetaEnv {
    readonly VITE_API_BASE: string
    // add more env vars if needed
    // readonly VITE_OTHER_KEY: string
}

interface ImportMeta {
    readonly env: ImportMetaEnv
}
