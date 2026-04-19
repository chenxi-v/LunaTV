import type { VercelRequest, VercelResponse } from '@vercel/node'

export default async function handler(req: VercelRequest, res: VercelResponse) {
  const proxyUrl = req.query.proxyUrl as string

  if (!proxyUrl) {
    return res.status(400).json({ error: 'Missing proxyUrl parameter' })
  }

  try {
    const cleanUrl = proxyUrl.replace(/\/$/, '')
    const startTime = Date.now()

    const response = await fetch(`${cleanUrl}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(10000),
    })

    const responseTime = Date.now() - startTime
    let healthy = false
    let error: string | undefined

    if (response.ok) {
      const text = await response.text()
      if (text.includes('OK') || text.includes('ok')) {
        healthy = true
      } else {
        error = 'Invalid health status'
      }
    } else {
      error = `HTTP ${response.status}`
    }

    res.setHeader('Content-Type', 'application/json')
    res.setHeader('Cache-Control', 'no-store')
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      proxyUrl: proxyUrl,
      health: { healthy, responseTime, error },
    })
  } catch (error: any) {
    res.setHeader('Content-Type', 'application/json')
    return res.status(200).json({
      timestamp: new Date().toISOString(),
      proxyUrl: proxyUrl,
      health: {
        healthy: false,
        error: error.message || 'Connection failed',
      },
    })
  }
}
