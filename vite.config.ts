import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  // 상대경로 base: localhost, GitHub Pages 루트 사이트(username.github.io),
  // GitHub Pages 프로젝트 사이트(username.github.io/저장소명/) 어디서든
  // 별도 설정 없이 자산 경로가 깨지지 않는다. 해시 기반 라우팅(#home 등)과도 무관하게 동작한다.
  base: './',
  plugins: [react()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  server: {
    port: 5173,
  },
  build: {
    rollupOptions: {
      // yaki.html은 메인 앱(index.html)과 완전히 분리된 별도 진입점이다.
      // 메인 앱의 라우팅(useRoute.ts)이나 전역 상태와는 무관하게 독립적으로 동작한다.
      input: {
        main: path.resolve(__dirname, 'index.html'),
        yaki: path.resolve(__dirname, 'yaki.html'),
      },
    },
  },
});
