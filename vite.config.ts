import { readFileSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { defineConfig } from 'vite'
import type { Plugin, ViteDevServer } from 'vite'
import react from '@vitejs/plugin-react'

function serveSignal(
  req: IncomingMessage,
  res: ServerResponse,
  next: () => void,
) {
  const pathname = req.url?.split('?')[0]
  if (pathname !== '/signal' && pathname !== '/signal/') {
    next()
    return
  }

  const file = readFileSync(resolve(process.cwd(), 'public/signal/index.html'), 'utf8')
  res.statusCode = 200
  res.setHeader('Content-Type', 'text/html')
  res.end(file)
}

function signalStaticRoute(): Plugin {
  return {
    name: 'signal-static-route',
    configureServer(server: ViteDevServer) {
      server.middlewares.use(serveSignal)
    },
    configurePreviewServer(server) {
      server.middlewares.use(serveSignal)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [signalStaticRoute(), react()],
})
