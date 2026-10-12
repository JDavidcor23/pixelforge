import { existsSync } from 'node:fs'
import type { IncomingMessage, ServerResponse } from 'node:http'
import { resolve } from 'node:path'
import { loadEnv, type Plugin, type ViteDevServer } from 'vite'

/**
 * Dev-only bridge for the Vercel Functions in `api/`. `vite` does not serve that
 * folder (only Vercel and `vercel dev` do), so `/api/*` returned 404 under
 * `pnpm dev`. This middleware loads the SAME handler module through Vite's SSR
 * loader and adapts Node's req/res to the Web `Request`/`Response` the handlers
 * use. Production is untouched: `apply: 'serve'` keeps it out of builds.
 */
const API_PREFIX = '/api/'
const ROUTE_PATTERN = /^\/api\/([a-z0-9-]+(?:\/[a-z0-9-]+)*)$/i
const METHODS_WITHOUT_BODY = new Set(['GET', 'HEAD'])

type Handler = (request: Request) => Promise<Response>

const readBody = async (req: IncomingMessage): Promise<Blob> => {
  const chunks: Buffer[] = []
  for await (const chunk of req) chunks.push(chunk as Buffer)
  return new Blob([new Uint8Array(Buffer.concat(chunks))])
}

const toWebRequest = async (req: IncomingMessage, origin: string): Promise<Request> => {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (value !== undefined) headers.set(key, Array.isArray(value) ? value.join(', ') : value)
  }
  const method = req.method ?? 'GET'
  const body = METHODS_WITHOUT_BODY.has(method) ? undefined : await readBody(req)
  return new Request(new URL(req.url ?? '/', origin), { method, headers, body })
}

const sendWebResponse = async (res: ServerResponse, response: Response): Promise<void> => {
  res.statusCode = response.status
  response.headers.forEach((value, key) => res.setHeader(key, value))
  res.end(Buffer.from(await response.arrayBuffer()))
}

export function vercelFunctionsDev(): Plugin {
  return {
    name: 'pixelforge:vercel-functions-dev',
    apply: 'serve',
    configureServer(server: ViteDevServer) {
      // Vercel injects server-only env vars (API_RETRO_DIFFUSION, ...) into
      // process.env; Vite only exposes VITE_* to the client. Mirror Vercel for
      // the handlers without overriding anything already set in the shell.
      const env = loadEnv(server.config.mode, server.config.envDir || server.config.root, '')
      for (const [key, value] of Object.entries(env)) process.env[key] ??= value

      server.middlewares.use(async (req, res, next) => {
        const path = (req.url ?? '').split('?')[0]
        if (!path.startsWith(API_PREFIX)) return next()
        const match = ROUTE_PATTERN.exec(path)
        if (!match || !existsSync(resolve(server.config.root, `.${API_PREFIX}${match[1]}.ts`))) return next()
        try {
          const mod = (await server.ssrLoadModule(`${API_PREFIX}${match[1]}.ts`)) as { default?: Handler }
          if (typeof mod.default !== 'function') return next()
          const origin = `http://${req.headers.host ?? 'localhost'}`
          await sendWebResponse(res, await mod.default(await toWebRequest(req, origin)))
        } catch (error) {
          console.error('[vercel-functions-dev]', path, error)
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: 'Dev function failed. See the terminal running the dev server.' }))
        }
      })
    },
  }
}
