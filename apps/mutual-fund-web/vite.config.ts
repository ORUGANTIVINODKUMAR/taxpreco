import { defineConfig, loadEnv } from 'vite'
import { devLoginPlugin } from './devLoginPlugin.ts'
import react from '@vitejs/plugin-react'

export default defineConfig(({ mode }) => ({
  plugins: [react(), devLoginPlugin(loadEnv(mode, process.cwd(), ''))],
  server: {
    host: '0.0.0.0',
    port: 5175,
    strictPort: true,
  },
}))
