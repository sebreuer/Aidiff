import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import fs from 'node:fs'
import path from 'node:path'

/** Ohne das sieht die Ziel-API „Browser/CORS“ und lehnt ab (z. B. Anthropic 401). */
function stripBrowserForwardedHeaders(proxyReq) {
  for (const h of [
    'origin',
    'referer',
    'sec-fetch-site',
    'sec-fetch-mode',
    'sec-fetch-dest',
    'sec-fetch-user',
  ]) {
    try {
      proxyReq.removeHeader(h)
    } catch {
      /* ignore */
    }
  }
}

function readApiKeysFromEnvFile(envPath, fallback = {}) {
  let content = ''
  try {
    content = fs.readFileSync(envPath, 'utf8')
  } catch {
    content = ''
  }
  const map = {
    OPENAI_API_KEY: fallback.OPENAI_API_KEY || '',
    ANTHROPIC_API_KEY: fallback.ANTHROPIC_API_KEY || '',
    GOOGLE_API_KEY: fallback.GOOGLE_API_KEY || '',
  }
  for (const line of content.split(/\r?\n/)) {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=\s*(.*)\s*$/)
    if (!m) continue
    const key = m[1]
    let value = m[2] || ''
    if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
      value = value.slice(1, -1)
    }
    if (key in map) map[key] = value
  }
  return map
}

function writeApiKeysToEnvFile(envPath, nextKeys) {
  let content = ''
  try {
    content = fs.readFileSync(envPath, 'utf8')
  } catch {
    content = ''
  }
  const keys = ['OPENAI_API_KEY', 'ANTHROPIC_API_KEY', 'GOOGLE_API_KEY']
  const lines = content ? content.split(/\r?\n/) : []
  const seen = new Set()
  const out = lines.map((line) => {
    const m = line.match(/^\s*([A-Z0-9_]+)\s*=/)
    if (!m) return line
    const k = m[1]
    if (!keys.includes(k)) return line
    seen.add(k)
    return `${k}=${nextKeys[k] || ''}`
  })
  for (const k of keys) {
    if (!seen.has(k)) out.push(`${k}=${nextKeys[k] || ''}`)
  }
  const finalText = `${out.join('\n').replace(/\n+$/g, '')}\n`
  fs.writeFileSync(envPath, finalText, 'utf8')
}

/** Dev + Preview: `/api/settings/keys` — muss vor SPA-Fallback laufen (eigenes Plugin, zuerst in `plugins`). */
function aidiffKeysPlugin({ envPath, keyStore }) {
  function attach(server) {
    server.middlewares.use((req, res, next) => {
      const raw = req.url || '/'
      const pathname = raw.split('?')[0]
      if (pathname !== '/api/settings/keys') return next()

      if (req.method === 'GET') {
        keyStore.current = readApiKeysFromEnvFile(envPath, keyStore.current)
        const k = keyStore.current
        res.statusCode = 200
        res.setHeader('content-type', 'application/json; charset=utf-8')
        res.end(
          JSON.stringify({
            openai: k.OPENAI_API_KEY || '',
            claude: k.ANTHROPIC_API_KEY || '',
            google: k.GOOGLE_API_KEY || '',
          })
        )
        return
      }

      if (req.method === 'POST') {
        let body = ''
        req.on('data', (chunk) => {
          body += chunk
        })
        req.on('end', () => {
          try {
            const parsed = body ? JSON.parse(body) : {}
            const next = {
              OPENAI_API_KEY: String(parsed.openai || ''),
              ANTHROPIC_API_KEY: String(parsed.claude || ''),
              GOOGLE_API_KEY: String(parsed.google || ''),
            }
            writeApiKeysToEnvFile(envPath, next)
            keyStore.current = next
            res.statusCode = 200
            res.setHeader('content-type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: true }))
          } catch {
            res.statusCode = 400
            res.setHeader('content-type', 'application/json; charset=utf-8')
            res.end(JSON.stringify({ ok: false, error: 'invalid request body' }))
          }
        })
        return
      }

      res.statusCode = 405
      res.setHeader('content-type', 'application/json; charset=utf-8')
      res.setHeader('allow', 'GET, POST')
      res.end(JSON.stringify({ ok: false, error: 'method not allowed' }))
    })
  }

  return {
    name: 'aidiff-env-keys-api',
    configureServer(server) {
      attach(server)
    },
    configurePreviewServer(server) {
      attach(server)
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const envPath = path.resolve(process.cwd(), '.env')
  const keyStore = { current: readApiKeysFromEnvFile(envPath, env) }

  const apiProxy = {
    '/api/anthropic': {
      target: 'https://api.anthropic.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/anthropic/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          stripBrowserForwardedHeaders(proxyReq)
          const key = keyStore.current.ANTHROPIC_API_KEY || ''
          if (key) proxyReq.setHeader('x-api-key', key)
          proxyReq.setHeader('anthropic-version', '2023-06-01')
        })
      },
    },
    '/api/openai': {
      target: 'https://api.openai.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/openai/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          stripBrowserForwardedHeaders(proxyReq)
          const key = keyStore.current.OPENAI_API_KEY || ''
          if (key) proxyReq.setHeader('authorization', `Bearer ${key}`)
        })
      },
    },
    '/api/google': {
      target: 'https://generativelanguage.googleapis.com',
      changeOrigin: true,
      rewrite: (path) => path.replace(/^\/api\/google/, ''),
      configure: (proxy) => {
        proxy.on('proxyReq', (proxyReq) => {
          stripBrowserForwardedHeaders(proxyReq)
          const key = keyStore.current.GOOGLE_API_KEY || ''
          if (key) proxyReq.setHeader('x-goog-api-key', key)
        })
      },
    },
  }

  return {
    plugins: [aidiffKeysPlugin({ envPath, keyStore }), react()],
    server: { proxy: apiProxy },
    preview: { proxy: apiProxy },
  }
})
