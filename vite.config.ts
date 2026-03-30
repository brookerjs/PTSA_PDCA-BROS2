import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import s3Proxy from './server/s3-proxy'

export default defineConfig({
  plugins: [s3Proxy(), react(), tailwindcss()],
})
