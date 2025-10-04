import { withUsageTracking } from '../cache/usage-tracker'
import smartCache from '../rate-limiter/smart-cache'

export const config = { runtime: 'edge' }

async function handler(req: Request) {
  if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
    return new Response(JSON.stringify({ error: 'Admin APIs disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  const adminKey = req.headers.get('x-admin-key')
  if (process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY !== adminKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  const walletHeader = req.headers.get('x-wallet-address')
  if (process.env.PLATFORM_CREATOR_ADDRESS && process.env.PLATFORM_CREATOR_ADDRESS !== walletHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized wallet address' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })

  try {
    const stats = smartCache.getStats()
    return new Response(JSON.stringify({ timestamp: new Date().toISOString(), stats }, null, 2), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export default withUsageTracking(handler, 'admin-smart-cache-stats', 'admin')
