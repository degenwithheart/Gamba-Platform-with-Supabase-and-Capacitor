import { cacheOnTheFly } from '../cache/xcacheOnTheFly'
import { withUsageTracking } from '../cache/usage-tracker'

export const config = { runtime: 'edge' }

const RPC_ENDPOINTS = [
  { name: 'Public RPC', url: process.env.VITE_RPC_ENDPOINT || 'https://api.mainnet-beta.solana.com', type: 'public' }
]

const RPC_TEST_CALLS = [ { method: 'getHealth', params: [], name: 'Health Check', critical: true } ]

async function testRpcEndpoint(endpoint: string, method: string, params: any[], timeout = 5000) {
  const controller = new AbortController(); const timeoutId = setTimeout(() => controller.abort(), timeout)
  const start = Date.now()
  try {
    const r = await fetch(endpoint, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ jsonrpc: '2.0', id: 1, method, params }), signal: controller.signal })
    clearTimeout(timeoutId)
    const responseTime = Date.now() - start
    if (!r.ok) throw new Error(`HTTP ${r.status}`)
    const data = await r.json()
    if (data.error) throw new Error('rpc error')
    return { success: true, responseTime, result: data.result }
  } catch (e: any) {
    clearTimeout(timeoutId)
    return { success: false, responseTime: Date.now() - start, error: e.message }
  }
}

async function rpcHealthHandler(req: Request) {
  // Runtime guard: only active when env var ENABLE_COMPREHENSIVE_ERROR_SYSTEM is set to 'true'
  if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
    return new Response(JSON.stringify({ error: 'Comprehensive error system disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })
  const cacheKey = 'rpc-health'
  const report = await cacheOnTheFly(cacheKey, async () => {
    const start = Date.now()
    const results = await Promise.all(RPC_ENDPOINTS.flatMap(ep => RPC_TEST_CALLS.map(tc => testRpcEndpoint(ep.url, tc.method, tc.params))))
    const duration = Date.now() - start
    return { timestamp: new Date().toISOString(), duration, results }
  }, { ttl: 30 * 1000 })

  return new Response(JSON.stringify(report, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=30' } })
}

export default withUsageTracking(rpcHealthHandler, 'rpc-health-api', 'monitoring')
