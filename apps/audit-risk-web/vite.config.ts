import react from '@vitejs/plugin-react'
import { defineConfig, loadEnv } from 'vite'
import { devLoginPlugin } from './devLoginPlugin.ts'

// https://vite.dev/config/
export default defineConfig(({ mode }) => ({
  plugins: [react(), devLoginPlugin(loadEnv(mode, process.cwd(), ''))],
  server: {
    host: '0.0.0.0',
    port: 5177,
    strictPort: true,
  },
}))
