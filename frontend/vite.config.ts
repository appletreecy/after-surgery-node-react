import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
    plugins: [react()],
    resolve: { alias: { '@': path.resolve(__dirname, './src') } },
    server: {
        port: 5173,
        proxy: {
            // Preferred calls: /api/...  → backend sees /...
            '/api': {
                target: 'http://localhost:8080',   // ← 8080 to match your backend
                changeOrigin: true,
                secure: false,
                rewrite: (p) => p.replace(/^\/api/, ''),
            },
            // Safety net if some code still hits /auth directly
            '/auth': {
                target: 'http://localhost:8080',
                changeOrigin: true,
                secure: false,
            },
            // add others if needed (e.g., /table-one) while you migrate to /api/*
        },
    },
})
