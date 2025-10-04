import { UsageTracker, withUsageTracking } from '../cache/usage-tracker'

export const config = { runtime: 'edge' }

async function debugUsageHandler(req: Request) {
  if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
    return new Response(JSON.stringify({ error: 'Comprehensive error system disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method === 'POST') {
    await UsageTracker.track({ timestamp: Date.now(), endpoint: 'helius-api', method: 'POST', category: 'helius', success: true, responseTime: 250 } as any)
    await UsageTracker.track({ timestamp: Date.now(), endpoint: 'coingecko', method: 'GET', category: 'price', success: true, responseTime: 150 } as any)
    return new Response(JSON.stringify({ message: 'Test data generated', timestamp: new Date().toISOString() }), { headers: { 'Content-Type': 'application/json' } })
  }
  if (req.method === 'GET') {
    const hourly = await UsageTracker.getCurrentHourUsage()
    const daily = await UsageTracker.getCurrentDayUsage()
    const rpc = await UsageTracker.getRpcEndpointUsage()
    return new Response(JSON.stringify({ hourly, daily, rpc }, null, 2), { headers: { 'Content-Type': 'application/json' } })
  }
  return new Response('Method Not Allowed', { status: 405 })
}

export default withUsageTracking(debugUsageHandler, 'debug-usage-api', 'monitoring')
