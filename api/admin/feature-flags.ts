import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_SERVICE_ROLE
const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE || '')

// Table schema assumed: feature_flags(key text primary key, value boolean, updated_at timestamptz)
export const config = { runtime: 'edge' }

async function handler(req: Request) {
  try {
    const adminKeyHeader = req.headers.get('x-admin-key') || ''
    if (!process.env.ADMIN_API_KEY || adminKeyHeader !== process.env.ADMIN_API_KEY) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    const walletHeader = req.headers.get('x-wallet-address') || ''
    if (process.env.PLATFORM_CREATOR_ADDRESS && process.env.PLATFORM_CREATOR_ADDRESS !== walletHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized wallet address' }), { status: 401, headers: { 'Content-Type': 'application/json' } })
    }
    if (process.env.ENABLE_COMPREHENSIVE_ERROR_SYSTEM !== 'true') {
      return new Response(JSON.stringify({ error: 'Comprehensive error system disabled' }), { status: 404, headers: { 'Content-Type': 'application/json' } })
    }

    if (req.method === 'GET') {
      const { data, error } = await supabase.from('feature_flags').select('*')
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } })
    }

    if (req.method === 'PUT') {
      const body = await req.json().catch(() => ({}))
      const { key, value } = body as any
      if (!key) return new Response(JSON.stringify({ error: 'key required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      const { data, error } = await supabase.from('feature_flags').upsert({ key, value }).select()
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ data: data?.[0] }), { headers: { 'Content-Type': 'application/json' } })
    }

    return new Response('Method Not Allowed', { status: 405 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export default handler
