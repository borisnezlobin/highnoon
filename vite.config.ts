import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { readFile, writeFile } from 'node:fs/promises'
import type { IncomingMessage } from 'node:http'
import { resolve } from 'node:path'
import { defineConfig, type Plugin } from 'vite'

const TIMERS_FILE = resolve(import.meta.dirname, 'timers.json')
const SLUG_PATTERN = /^[a-z0-9](?:[a-z0-9-]{0,38}[a-z0-9])?$/

async function readBody(request: IncomingMessage) {
  const chunks: Buffer[] = []
  for await (const chunk of request) chunks.push(chunk as Buffer)
  return Buffer.concat(chunks).toString('utf8')
}

function timerStore(): Plugin {
  return {
    name: 'timer-store',
    async generateBundle() {
      this.emitFile({ type: 'asset', fileName: 'timers.json', source: await readFile(TIMERS_FILE, 'utf8') })
    },
    configureServer(server) {
      server.middlewares.use('/timers.json', async (_request, response) => {
        response.setHeader('content-type', 'application/json')
        response.end(await readFile(TIMERS_FILE, 'utf8'))
      })
      server.middlewares.use('/__timers', async (request, response) => {
        if (request.method !== 'POST') {
          response.statusCode = 405
          return response.end('Only POST is supported')
        }
        const { slug, timer } = JSON.parse(await readBody(request))
        if (typeof slug !== 'string' || !SLUG_PATTERN.test(slug)) {
          response.statusCode = 400
          return response.end('That link name isn’t valid')
        }
        const timers = JSON.parse(await readFile(TIMERS_FILE, 'utf8'))
        timers[slug] = timer
        await writeFile(TIMERS_FILE, `${JSON.stringify(timers, null, 2)}\n`)
        response.setHeader('content-type', 'application/json')
        response.end(JSON.stringify({ slug }))
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), timerStore()],
})
