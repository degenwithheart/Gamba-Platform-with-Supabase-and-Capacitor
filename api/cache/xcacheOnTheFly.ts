import cache, { cacheGet, cacheSet } from './xcache-edge'

export const CacheTTL = {
  MINUTE: 60 * 1000,
  FIVE_MINUTES: 5 * 60 * 1000,
  TEN_MINUTES: 10 * 60 * 1000,
  HOUR: 60 * 60 * 1000,
}

export async function cacheOnTheFly<T>(key: string, fetcher: () => Promise<T>, options: { ttl?: number; skipCache?: boolean; forceRefresh?: boolean } = {}) {
  const { ttl, skipCache = false, forceRefresh = false } = options
  if (skipCache) return await fetcher()
  if (forceRefresh) { const v = await fetcher(); cacheSet(key, v, ttl); return v }
  const existing = cacheGet(key)
  if (existing !== undefined) return existing
  const value = await fetcher()
  cacheSet(key, value, ttl)
  return value
}

export function cacheValue<T>(key: string, value: T, ttl?: number) { cacheSet(key, value, ttl); return value }
