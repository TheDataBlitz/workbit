import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  resolve: {
    // Prevent duplicate React copies (causes "Invalid hook call") when consuming
    // libraries that have React as a peer dependency.
    dedupe: ['react', 'react-dom'],
  },
  server: {
    proxy: {
      // Forward frontend `/api/*` requests to the API server (3001).
      '/api': {
        target: 'http://localhost:3001',
        changeOrigin: true,
      },
    },
  },
})
