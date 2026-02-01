import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'fs'
import path from 'path'

// https://vitejs.dev/config/
export default defineConfig(({ command }) => ({
  plugins: [
    react(),
    {
      name: 'wiki-404-middleware',
      configureServer(server) {
        if (command !== 'serve') return
        server.middlewares.use((req, res, next) => {
          const url = req.url || ''
          if (!url.startsWith('/wiki/')) return next()

          const cleanPath = url.split('?')[0].split('#')[0]
          const publicPath = path.join(server.config.root, 'public', cleanPath)
          if (fs.existsSync(publicPath)) {
            return next()
          }

          const fallbackPath = path.join(server.config.root, 'public', 'wiki', '404.html')
          if (fs.existsSync(fallbackPath)) {
            res.statusCode = 404
            res.setHeader('Content-Type', 'text/html; charset=utf-8')
            res.end(fs.readFileSync(fallbackPath, 'utf-8'))
            return
          }

          return next()
        })
      }
    }
  ],
  base: command === 'build' ? './' : '/',
  server: {
    port: 3000,
    open: true
  },
  build: {
    outDir: 'dist',
    sourcemap: true
  }
}))
