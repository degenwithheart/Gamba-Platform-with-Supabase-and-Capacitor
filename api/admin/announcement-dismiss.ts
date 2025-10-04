import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL
const SUPABASE_SERVICE_ROLE = process.env.SUPABASE_SERVICE_ROLE || process.env.VITE_SUPABASE_SERVICE_ROLE
const supabase = createClient(SUPABASE_URL || '', SUPABASE_SERVICE_ROLE || '')

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

    if (req.method === 'POST') {
      const body = await req.json().catch(() => ({}))
      const { user_id, announcement_id } = body as any
      if (!user_id || !announcement_id) return new Response(JSON.stringify({ error: 'user_id and announcement_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
  // Upsert to avoid duplicate dismissals
  const { data, error } = await supabase.from('announcement_dismissals').upsert({ user_id, announcement_id }, { onConflict: 'user_id,announcement_id' }).select()
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ data: data?.[0] }), { headers: { 'Content-Type': 'application/json' } })
    }

    if (req.method === 'GET') {
      const url = new URL(req.url)
      const user_id = url.searchParams.get('user_id')
      if (!user_id) return new Response(JSON.stringify({ error: 'user_id required' }), { status: 400, headers: { 'Content-Type': 'application/json' } })
      const { data, error } = await supabase.from('announcement_dismissals').select('*').eq('user_id', user_id)
      if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
      return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } })
    }

    return new Response('Method Not Allowed', { status: 405 })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}

export default handler
