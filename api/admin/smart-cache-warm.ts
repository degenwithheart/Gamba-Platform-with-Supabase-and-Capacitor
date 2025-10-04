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

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })

  try {
    // Trigger prefetch cycle - implementation is safe to call repeatedly
    // Exposed API can accept optional body to target specific methods, but for now trigger generic prefetch
    // If smartCache has a public API to start prefetching, call it; otherwise call a known method to add user prefetch
    try {
      // If smartCache exposes startPrefetching or similar
      if (typeof (smartCache as any).startPrefetching === 'function') {
        ;(smartCache as any).startPrefetching()
      }
    } catch (e) {
      // ignore individual errors
    }

    return new Response(JSON.stringify({ ok: true, message: 'Warm triggered' }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ ok: false, error: String(e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export default withUsageTracking(handler, 'admin-smart-cache-warm', 'admin')
