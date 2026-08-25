/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_CAMERA_URL?: string;
  readonly VITE_TALLY_URL?: string;
  readonly VITE_MODO_PRUEBA?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
