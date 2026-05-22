import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

const DEFAULT_DEV_API_PROXY_TARGET = 'http://127.0.0.1:8000'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const apiProxyTarget = env.VITE_DEV_API_ORIGIN || DEFAULT_DEV_API_PROXY_TARGET

  return {
    plugins: [react()],
    server: {
      proxy: {
        '/api': {
          target: apiProxyTarget,
          changeOrigin: true,
          ws: true,
          secure: apiProxyTarget.startsWith('https://'),
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
  }
})
