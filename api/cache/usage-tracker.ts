type UsageRecord = { timestamp: number; endpoint: string; method: string; category: string; success: boolean; responseTime: number }

const records: UsageRecord[] = []

export const UsageTracker = {
  track: async (r: UsageRecord) => { records.push(r); return true },
  getCurrentHourUsage: async () => {
    const cutoff = Date.now() - 60 * 60 * 1000
    const hour = records.filter(r => r.timestamp >= cutoff)
    const totals: any = { total: hour.length }
    hour.forEach(r => { totals[r.category] = (totals[r.category] || 0) + 1 })
    return totals
  },
  getCurrentDayUsage: async () => {
    const cutoff = Date.now() - 24 * 60 * 60 * 1000
    const day = records.filter(r => r.timestamp >= cutoff)
    const totals: any = { total: day.length }
    day.forEach(r => { totals[r.category] = (totals[r.category] || 0) + 1 })
    return totals
  },
  getRpcEndpointUsage: async () => {
    const by: Record<string, number> = {}
    records.forEach(r => { if (r.category === 'rpc') by[r.endpoint] = (by[r.endpoint] || 0) + 1 })
    return by
  },
  getDebugStats: () => ({ recordsCount: records.length }),
}

export const withUsageTracking = (handler: any, name = 'api', category = 'api') => {
  return async (req: Request) => {
    try {
      const res = await handler(req)
      try { await UsageTracker.track({ timestamp: Date.now(), endpoint: name, method: (req.method || 'GET'), category, success: true, responseTime: 0 }) } catch (e) {}
      return res
    } catch (err) {
      try { await UsageTracker.track({ timestamp: Date.now(), endpoint: name, method: (req.method || 'GET'), category, success: false, responseTime: 0 }) } catch (e) {}
      throw err
    }
  }
}

export default UsageTracker
