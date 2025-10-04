import { createClient } from '@supabase/supabase-js'

const SUPABASE_URL = process.env.VITE_SUPABASE_URL as string
const SUPABASE_ANON = process.env.VITE_SUPABASE_ANON_KEY as string

const supabase = createClient(SUPABASE_URL || '', SUPABASE_ANON || '')

export const config = { runtime: 'edge' }

export default async function handler(req: Request) {
  try {
    if (req.method !== 'GET') return new Response('Method Not Allowed', { status: 405 })
    const { data, error } = await supabase.from('feature_flags').select('*')
    if (error) return new Response(JSON.stringify({ error: error.message }), { status: 500, headers: { 'Content-Type': 'application/json' } })
    return new Response(JSON.stringify({ data }), { headers: { 'Content-Type': 'application/json' } })
  } catch (e: any) {
    return new Response(JSON.stringify({ error: String(e.message || e) }), { status: 500, headers: { 'Content-Type': 'application/json' } })
  }
}
