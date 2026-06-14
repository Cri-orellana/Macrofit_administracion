// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  
  server: {
    proxy: {
      '/api/ejercicios': {
        target: 'http://165.1.126.244',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/rutinas': {
        target: 'http://165.1.126.244',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/rutina-ejercicio': {
        target: 'http://165.1.126.244',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },
      '/api/rutina-usuario': {
        target: 'http://165.1.126.244',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api/, '')
      },

      '/api': {
        target: 'http://165.1.126.244',
        changeOrigin: true,
        secure: false,
      },
    }
  },

  test: {
    environment: 'jsdom',
    globals: true
  }
})