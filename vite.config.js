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
});
