interface CacheItem { value: any; timestamp: number; ttl?: number }

class EnhancedCache {
  private cache = new Map<string, CacheItem>()
  private maxSize = 1000
  private defaultTTL = 5 * 60 * 1000

  get(key: string) {
    const it = this.cache.get(key)
    if (!it) return undefined
    if (it.ttl && Date.now() - it.timestamp > it.ttl) { this.cache.delete(key); return undefined }
    return it.value
  }

  set(key: string, value: any, ttl?: number) {
    if (this.cache.size >= this.maxSize) this.cache.delete(this.cache.keys().next().value)
    this.cache.set(key, { value, timestamp: Date.now(), ttl: ttl || this.defaultTTL })
    return true
  }

  has(key: string) { return this.get(key) !== undefined }
  delete(key: string) { return this.cache.delete(key) }
  clear() { this.cache.clear() }
  cleanup() {
    let cleaned = 0
    const now = Date.now()
    // Use Array.from to avoid downlevel iteration issues in older tsconfig targets
    for (const [k, v] of Array.from(this.cache.entries())) {
      if (v.ttl && now - v.timestamp > v.ttl) {
        this.cache.delete(k)
        cleaned++
      }
    }
    return cleaned
  }
  getStats() { return { size: this.cache.size, maxSize: this.maxSize } }
  configure(options: { maxSize?: number; defaultTTL?: number }) { if (options.maxSize) this.maxSize = options.maxSize; if (options.defaultTTL) this.defaultTTL = options.defaultTTL }
}

const cache = new EnhancedCache()

if (typeof setInterval !== 'undefined') {
  setInterval(() => { const cleaned = cache.cleanup(); if (cleaned > 0) console.log('[xcache] cleaned', cleaned) }, 5 * 60 * 1000)
}

const serverCacheEnabled = process.env.ENABLE_CACHE_SYSTEM === 'true'

export function cacheGet(k: string) { return serverCacheEnabled ? cache.get(k) : undefined }
export function cacheSet(k: string, v: any, ttl?: number) { return serverCacheEnabled ? cache.set(k, v, ttl) : false }
export function cacheHas(k: string) { return serverCacheEnabled ? cache.has(k) : false }
export function cacheDelete(k: string) { return serverCacheEnabled ? cache.delete(k) : false }
export function cacheCleanup() { return serverCacheEnabled ? cache.cleanup() : 0 }
export function cacheStats() { return serverCacheEnabled ? cache.getStats() : { size: 0, maxSize: 0 } }
export function cacheConfigure(o: any) { if (serverCacheEnabled) cache.configure(o) }

export default serverCacheEnabled ? cache : undefined
