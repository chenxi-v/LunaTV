import type { VercelRequest, VercelResponse } from '@vercel/node'

const DEFAULT_PROXY_TIMEOUT_MS = 15000

export default async function handler(req: VercelRequest, res: VercelResponse) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    const { url } = req.query

    if (!url || typeof url !== 'string') {
      return res.status(400).json({ error: 'URL parameter is required' })
    }

    const targetUrl = decodeURIComponent(url)
    
    // 验证 URL 格式
    try {
      new URL(targetUrl)
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' })
    }

    // 发起代理请求
    const response = await fetch(targetUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        Accept: 'application/json, text/plain, */*',
      },
      signal: AbortSignal.timeout(DEFAULT_PROXY_TIMEOUT_MS),
    })

    const text = await response.text()
    const contentType = response.headers.get('content-type') || 'application/json'

    res.setHeader('Content-Type', contentType)
    res.setHeader('Cache-Control', 'public, max-age=60')
    res.status(response.status).send(text)
  } catch (error) {
    console.error('Proxy error:', error)
    const message = error instanceof Error ? error.message : 'Unknown error'
    res.status(500).json({ error: 'Proxy request failed', message })
  }
}
