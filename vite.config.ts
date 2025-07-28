import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 3000,
    open: true,
  },
  envPrefix: 'VITE_',
  build: {
    // 청크 크기 경고 임계값을 1000KB로 조정
    chunkSizeWarningLimit: 1000,
    // 프로덕션에서는 소스맵 비활성화
    sourcemap: false,
    // 기본 minify 사용
    minify: true
  }
}); 