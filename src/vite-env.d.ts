/// <reference types="vite/client" />

interface ImportMetaEnv {
  // Suppression des variables Firebase qui ne sont plus utilisées
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}