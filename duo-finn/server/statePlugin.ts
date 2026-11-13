import fs from 'node:fs'
import path from 'node:path'
import type { Connect, Plugin } from 'vite'

const filePath = path.resolve(process.cwd(), 'data', 'duo-finn.json')

function send(res: Connect.ServerResponse, status: number, body: unknown) {
  res.statusCode = status
  res.setHeader('content-type', 'application/json')
  res.end(JSON.stringify(body))
}

function readBody(req: Connect.IncomingMessage): Promise<string> {
  return new Promise((resolve, reject) => {
    const chunks: Buffer[] = []
    req.on('data', (chunk) => chunks.push(Buffer.from(chunk)))
    req.on('end', () => resolve(Buffer.concat(chunks).toString('utf8')))
    req.on('error', reject)
  })
}

const handleState: Connect.NextHandleFunction = (req, res, next) => {
  const url = req.url?.split('?')[0]
  if (url !== '/api/state') {
    next()
    return
  }

  if (req.method === 'GET') {
    if (!fs.existsSync(filePath)) {
      send(res, 404, { error: 'empty' })
      return
    }
    try {
      send(res, 200, JSON.parse(fs.readFileSync(filePath, 'utf8')))
    } catch {
      send(res, 500, { error: 'read' })
    }
    return
  }

  if (req.method === 'PUT') {
    void readBody(req)
      .then((raw) => {
        const parsed = JSON.parse(raw) as { data?: unknown }
        if (!parsed.data || typeof parsed.data !== 'object') {
          send(res, 400, { error: 'invalid' })
          return
        }
        const stored = { updatedAt: Date.now(), data: parsed.data }
        fs.mkdirSync(path.dirname(filePath), { recursive: true })
        const tmp = `${filePath}.tmp`
        fs.writeFileSync(tmp, JSON.stringify(stored))
        fs.renameSync(tmp, filePath)
        send(res, 200, stored)
      })
      .catch(() => send(res, 400, { error: 'invalid' }))
    return
  }

  next()
}

/** Um arquivo no projeto, lido por qualquer navegador em localhost. */
export function stateFilePlugin(): Plugin {
  return {
    name: 'duo-finn-state',
    configureServer(server) {
      server.middlewares.use(handleState)
    },
    configurePreviewServer(server) {
      server.middlewares.use(handleState)
    },
  }
}
