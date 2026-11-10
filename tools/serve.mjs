import { createReadStream, existsSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { extname, join, normalize, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = resolve(fileURLToPath(new URL('.', import.meta.url)), '..')
const dist = join(root, 'dist')
const port = Number(process.env.PORT || 4173)
const host = '127.0.0.1'

const mimeTypes = {
  '.css': 'text/css; charset=utf-8',
  '.html': 'text/html; charset=utf-8',
  '.ico': 'image/x-icon',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

function sendFile(res, filePath) {
  const contentType = mimeTypes[extname(filePath).toLowerCase()] || 'application/octet-stream'
  res.writeHead(200, {
    'Content-Type': contentType,
    'Cache-Control': 'no-cache',
  })
  createReadStream(filePath).pipe(res)
}

const server = createServer((req, res) => {
  if (!req.url || req.method !== 'GET') {
    res.writeHead(404).end()
    return
  }

  const url = new URL(req.url, `http://${host}:${port}`)
  const pathname = normalize(decodeURIComponent(url.pathname)).replace(/^(\.\.(\/|\\|$))+/, '')
  let filePath = join(dist, pathname)

  if (existsSync(filePath) && statSync(filePath).isFile()) {
    sendFile(res, filePath)
    return
  }

  const indexPath = join(dist, 'index.html')
  if (existsSync(indexPath)) {
    sendFile(res, indexPath)
    return
  }

  res.writeHead(503, { 'Content-Type': 'text/plain; charset=utf-8' })
  res.end('应用尚未构建。请先运行 npm run build。')
})

server.on('error', (error) => {
  console.error(`[server] ${error.message}`)
  process.exitCode = 1
})

server.listen(port, host, () => {
  console.log(`个人工作生活 App 已启动：http://${host}:${port}`)
})
