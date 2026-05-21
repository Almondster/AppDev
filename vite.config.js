import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_API_PROXY_TARGET = 'https://createch-backend-fastapi.onrender.com'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  server: {
    proxy: {
      '/api': {
        target: DEFAULT_API_PROXY_TARGET,
        changeOrigin: true,
        ws: true,
        secure: true,
      },
    },
  },
  build: {
    // Enable minification and tree-shaking
    minify: 'esbuild',
    target: 'es2020',
    // Split vendor chunks for better caching
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: ['react', 'react-dom', 'react-router-dom'],
          icons: ['lucide-react'],
        },
      },
    },
    // Enable source maps for production debugging
    sourcemap: false,
    // Reduce chunk size warnings threshold
    chunkSizeWarningLimit: 500,
  },
})
