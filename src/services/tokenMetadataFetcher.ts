import { makeHeliusTokenFetcher } from 'gamba-react-ui-v2'

// Builds a token metadata fetcher using Helius and an optional client cache wrapper.
export const buildTokenMetadataFetcher = () => {
  if (!import.meta.env.VITE_HELIUS_API_KEY) return undefined

  const baseFetcher = makeHeliusTokenFetcher(import.meta.env.VITE_HELIUS_API_KEY, { dollarBaseWager: 1 })

  return async (...args: any[]) => {
    const key = `token-meta:${JSON.stringify(args)}`
    try {
      const { default: clientCache } = await import('./clientCache')
      const cached = clientCache.get(key)
      if (cached) return cached
      const result = await (baseFetcher as any)(...args)
      clientCache.set(key, result, 60 * 60 * 1000)
      return result
    } catch (e) {
      return (baseFetcher as any)(...args)
    }
  }
}

export const TOKEN_METADATA_FETCHER = buildTokenMetadataFetcher()

export default TOKEN_METADATA_FETCHER
