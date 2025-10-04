import { cacheOnTheFly, CacheTTL } from '../cache/xcacheOnTheFly'
import { UsageTracker, withUsageTracking } from '../cache/usage-tracker'

export const config = { runtime: 'edge' }

async function calculateCurrentUsage() {
  await UsageTracker.track({ timestamp: Date.now(), endpoint: 'usage-metrics', method: 'GET', category: 'monitoring', success: true, responseTime: 1 } as any)
  const hourly = await UsageTracker.getCurrentHourUsage()
  const daily = await UsageTracker.getCurrentDayUsage()
  const rpc = await UsageTracker.getRpcEndpointUsage()
  return { timestamp: new Date().toISOString(), hourly, daily, rpc }
}

async function usageMetricsHandler(req: Request) {
  if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
    return new Response(JSON.stringify({ error: 'Comprehensive error system disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })
  const cacheKey = 'api-usage-metrics'
  const metrics = await cacheOnTheFly(cacheKey, calculateCurrentUsage, { ttl: CacheTTL.FIVE_MINUTES })
  return new Response(JSON.stringify(metrics, null, 2), { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'public, max-age=300' } })
}

export default withUsageTracking(usageMetricsHandler, 'usage-metrics-api', 'monitoring')
