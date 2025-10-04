import { withUsageTracking } from '../cache/usage-tracker'
import cache, { cacheGet, cacheSet } from '../cache/xcache-edge'

export const config = { runtime: 'edge' }

async function handler(req: Request) {
  if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
    return new Response(JSON.stringify({ error: 'Admin APIs disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  // Simple auth: require x-admin-key to match ADMIN_API_KEY env var when present
  const adminKey = req.headers.get('x-admin-key')
  if (process.env.ADMIN_API_KEY && process.env.ADMIN_API_KEY !== adminKey) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  // Wallet address header check (optional): require x-wallet-address to match PLATFORM_CREATOR_ADDRESS if set
  const walletHeader = req.headers.get('x-wallet-address')
  if (process.env.PLATFORM_CREATOR_ADDRESS && process.env.PLATFORM_CREATOR_ADDRESS !== walletHeader) {
    return new Response(JSON.stringify({ error: 'Unauthorized wallet address' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  // Clear the in-memory cache by recreating the cache map if possible
  try {
    if (cache && typeof cache.clear === 'function') {
      cache.clear()
    } else if (typeof (globalThis as any).xcache === 'object' && (globalThis as any).xcache.clear) {
      ;(globalThis as any).xcache.clear()
    }

    return new Response(JSON.stringify({ ok: true }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export default withUsageTracking(handler, 'admin-cache-clear', 'admin')
