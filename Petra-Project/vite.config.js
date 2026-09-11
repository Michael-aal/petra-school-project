import { defineConfig } from 'vite'
import path from 'node:path'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { loadEnv } from 'vite'

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const backendEnv = loadEnv(mode, path.resolve(__dirname, '../backend'), '')
  const backendOriginSecret = backendEnv.ORIGIN_SECRET
  const backendPort = backendEnv.PORT || '5000'

  return {
    plugins: [react(),
       tailwindcss(),
    ],
    server: {
      proxy: {
        '/api': {
          target: `http://localhost:${backendPort}`,
          changeOrigin: true,
          configure: (proxy) => {
            proxy.on('proxyReq', (proxyReq) => {
              if (backendOriginSecret) {
                proxyReq.setHeader('x-origin-secret', backendOriginSecret)
              }
            })
          },
        },
      },
    },
    build: {
      rollupOptions: {
        output: {
          manualChunks(id) {
            if (!id.includes('node_modules')) return undefined

            if (id.includes('react') || id.includes('react-dom') || id.includes('react-router')) {
              return 'vendor-react'
            }

            return 'vendor'
          },
        },
      },
    },
  }
})

