import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import s3Proxy from './server/s3-proxy'
import { readFileSync } from 'node:fs'

const { version } = JSON.parse(readFileSync('./package.json', 'utf-8')) as { version: string }

export default defineConfig({
  plugins: [s3Proxy(), react(), tailwindcss()],
  define: {
    'import.meta.env.PACKAGE_VERSION': JSON.stringify(version),
  },
})
