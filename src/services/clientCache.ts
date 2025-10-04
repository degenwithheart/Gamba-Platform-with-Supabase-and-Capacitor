import { ENABLE_CACHE_SYSTEM } from '../constants'

const prefix = 'client-cache:'

export const clientCacheGet = (key: string) => {
  if (!ENABLE_CACHE_SYSTEM) return undefined
  try {
    const raw = localStorage.getItem(prefix + key)
    if (!raw) return undefined
    const parsed = JSON.parse(raw)
    if (parsed.expires && Date.now() > parsed.expires) {
      localStorage.removeItem(prefix + key)
      return undefined
    }
    return parsed.value
  } catch (e) { return undefined }
}

export const clientCacheSet = (key: string, value: any, ttl = 30_000) => {
  if (!ENABLE_CACHE_SYSTEM) return true
  try {
    const obj = { value, expires: Date.now() + ttl }
    localStorage.setItem(prefix + key, JSON.stringify(obj))
    return true
  } catch (e) { return false }
}

export default { get: clientCacheGet, set: clientCacheSet }
