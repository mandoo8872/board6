/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_FIREBASE_DATABASE_URL: string
  // 필요한 환경변수 추가
}

interface ImportMeta {
  readonly env: ImportMetaEnv
} 