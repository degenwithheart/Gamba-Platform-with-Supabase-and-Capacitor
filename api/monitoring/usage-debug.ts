import { UsageTracker, withUsageTracking } from '../cache/usage-tracker'

export const config = { runtime: 'edge' }

async function usageDebugHandler(req: Request) {
  if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
    return new Response(JSON.stringify({ error: 'Comprehensive error system disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
  }

  if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })
  const debugStats = UsageTracker.getDebugStats()
  const hourly = await UsageTracker.getCurrentHourUsage()
  const daily = await UsageTracker.getCurrentDayUsage()
  const rpc = await UsageTracker.getRpcEndpointUsage()
  return new Response(JSON.stringify({ timestamp: new Date().toISOString(), debugStats, hourly, daily, rpc }, null, 2), { headers: { 'Content-Type': 'application/json' } })
}

export default withUsageTracking(usageDebugHandler, 'usage-debug-api', 'monitoring')
