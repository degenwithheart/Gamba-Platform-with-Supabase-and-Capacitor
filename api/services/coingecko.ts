import { cacheOnTheFly, CacheTTL } from '../cache/xcacheOnTheFly'
import { withUsageTracking } from '../cache/usage-tracker'
import rateLimiter from '../rate-limiter/rate-limiter'

export const config = {
  runtime: 'edge',
}

async function coingeckoHandler(req: Request): Promise<Response> {
  const origin = req.headers.get('origin');
  const allowedOrigins = new Set(['https://degenheart.casino', 'http://localhost:4001']);
  const corsOrigin = origin && allowedOrigins.has(origin) ? origin : 'https://degenheart.casino';

  try {
    // Check rate limit for public price provider usage (map to a conservative provider)
    try {
      const limitResult = await rateLimiter.checkLimit('ankr', 'coingecko-api')
      if (!limitResult.allowed) {
        return new Response(JSON.stringify({
          error: 'Rate limit exceeded',
          retryAfter: limitResult.retryAfter,
          currentRps: limitResult.currentRps,
          monthlyUsage: limitResult.monthlyUsage,
          limits: limitResult.limitInfo
        }), {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Access-Control-Allow-Origin': corsOrigin,
            'Vary': 'Origin',
            'Retry-After': String(limitResult.retryAfter || 1),
            'X-RateLimit-Remaining': String(limitResult.limitInfo.rpsRemaining),
            'X-RateLimit-Reset': String(limitResult.limitInfo.resetTime)
          }
        })
      }
    } catch (e) {
      // If rate limiter fails unexpectedly, log and continue (fail-open)
      console.warn('Rate limiter check failed for coingecko:', e instanceof Error ? e.message : String(e))
    }

    const url = new URL(req.url)
    const ids = url.searchParams.get('ids') || 'solana,usd-coin,jupiter-exchange,bonk'
    const vs_currencies = url.searchParams.get('vs_currencies') || 'usd'
    
    // Cache prices for 2 minutes
    const cacheKey = `coingecko:${ids}:${vs_currencies}`
    
    const prices = await cacheOnTheFly(cacheKey, async () => {
      // Try CoinGecko first
      try {
        const coingeckoUrl = `https://api.coingecko.com/api/v3/simple/price?ids=${ids}&vs_currencies=${vs_currencies}`
        
        const response = await fetch(coingeckoUrl, {
          headers: {
            'User-Agent': 'DegenCasino/1.0',
            'Accept': 'application/json',
          },
        })
        
        if (response.ok) {
          return await response.json()
        }
        
        console.warn('CoinGecko API failed, trying CoinMarketCap fallback')
      } catch (error) {
        console.warn('CoinGecko API error:', error instanceof Error ? error.message : String(error))
      }
      
      // Fallback to CoinMarketCap
      try {
        // Map CoinGecko IDs to CoinMarketCap symbols
        const idMapping: Record<string, string> = {
          'solana': 'SOL',
          'usd-coin': 'USDC',
          'jupiter-exchange': 'JUP',
          'bonk': 'BONK'
        }
        
        const cmcSymbols = ids.split(',').map(id => idMapping[id.trim()] || id.trim()).join(',')
        const cmcUrl = `https://pro-api.coinmarketcap.com/v1/cryptocurrency/quotes/latest?symbol=${cmcSymbols}&convert=${vs_currencies.toUpperCase()}`
        
        const response = await fetch(cmcUrl, {
          headers: {
            'User-Agent': 'DegenCasino/1.0',
            'Accept': 'application/json',
            'X-CMC_PRO_API_KEY': process.env.CMC_API_KEY || '', // Optional: add your CMC API key
          },
        })
        
        if (response.ok) {
          const data = await response.json()
          
          // Transform CMC response to match CoinGecko format
          const transformedPrices: Record<string, any> = {}
          for (const [cgId, symbol] of Object.entries(idMapping)) {
            if (data.data[symbol]) {
              transformedPrices[cgId] = {
                [vs_currencies]: data.data[symbol].quote[vs_currencies.toUpperCase()].price
              }
            }
          }
          
          if (Object.keys(transformedPrices).length > 0) {
            return transformedPrices
          }
        }
        
        console.warn('CoinMarketCap API failed, using cached fallback')
      } catch (error) {
        console.warn('CoinMarketCap API error:', error instanceof Error ? error.message : String(error))
      }
      
      // If both APIs fail, throw error to use hardcoded fallback
      throw new Error('All price APIs failed')
    }, { ttl: CacheTTL.FIVE_MINUTES }) // Enhanced cache with 5 min TTL for better price accuracy
    
    // Attach rate limiter status headers if available
    let rateHeaders: Record<string, string> = {}
    try {
      const status = rateLimiter.getStatus('ankr')
      rateHeaders['X-RateLimit-CurrentRps'] = String(status.currentRps)
      rateHeaders['X-RateLimit-MonthlyUsage'] = String(status.monthlyUsage)
      rateHeaders['X-RateLimit-LimitRps'] = String(status.limits.rpsLimit)
    } catch (e) {
      // ignore
    }

    return new Response(JSON.stringify(prices), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=120', // 2 minute browser cache
        'Access-Control-Allow-Origin': corsOrigin,
        'Vary': 'Origin',
        'Access-Control-Allow-Methods': 'GET, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type',
        ...rateHeaders
      },
    })
    
  } catch (error) {
    console.error('CoinGecko proxy error:', error instanceof Error ? error.message : String(error))
    
    // Return fallback prices
    const fallbackPrices = {
      'solana': { usd: 230 },
      'usd-coin': { usd: 1 },
      'jupiter-exchange': { usd: 0.85 },
      'bonk': { usd: 0.000025 }
    }
    
    return new Response(JSON.stringify(fallbackPrices), {
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60',
        'Access-Control-Allow-Origin': corsOrigin,
        'Vary': 'Origin',
      },
      status: 202 // Accepted (using fallback)
    })
  }
}

// Export with usage tracking
export default withUsageTracking(coingeckoHandler, 'coingecko-api', 'price');
