import { withUsageTracking } from '../cache/usage-tracker'

export const config = { runtime: 'edge' }

async function handler(req: Request) {
  if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
    return new Response(JSON.stringify({ error: 'Comprehensive error system disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method !== 'POST') return new Response('Method Not Allowed', { status: 405 })
  try {
    const body = await req.json()
    // For now, we log to console and return 200. The UsageTracker in-memory store can be extended.
    console.warn('[client-error]', body)
    return new Response(JSON.stringify({ ok: true }), { status: 200, headers: { 'Content-Type': 'application/json' } })
  } catch (e) {
    return new Response(JSON.stringify({ error: 'Invalid JSON' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  }
}

export default withUsageTracking(handler, 'report-error', 'monitoring')
