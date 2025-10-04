import React, { useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { PLATFORM_CREATOR_ADDRESS, ENABLE_CACHE_SYSTEM as COMPILED_ENABLE_CACHE_SYSTEM, ENABLE_SUPABASE_AUTH } from '../constants'
import AdminModal from './Admin/AdminModal'
import { GambaUi } from 'gamba-react-ui-v2'

export default function AdminPage() {
  const { publicKey } = useWallet()
  const [data, setData] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [rateStatus, setRateStatus] = useState<any>(null)
  const [cacheClearResult, setCacheClearResult] = useState<any>(null)
  const [smartCacheStats, setSmartCacheStats] = useState<any>(null)
  const [warmResult, setWarmResult] = useState<any>(null)
  const [modalOpen, setModalOpen] = useState(false)
  const [modalContent, setModalContent] = useState<any>(null)
  const [announcementTitle, setAnnouncementTitle] = useState('')
  const [announcementBody, setAnnouncementBody] = useState('')
  const [usersList, setUsersList] = useState<any[]>([])
  const [featureFlags, setFeatureFlags] = useState<any[]>([])

  const isCreator = publicKey?.toBase58() === PLATFORM_CREATOR_ADDRESS.toBase58()

  useEffect(() => {
    if (!isCreator) return
    setLoading(true)
    ;(async () => {
      try {
        const res = await fetch('/api/monitoring/usage-debug')
        const text = await res.text()
        try {
          const json = JSON.parse(text)
          setData(json)
        } catch (e) {
          setData({ error: `Non-JSON response`, body: text })
        }
      } catch (e) {
        setData({ error: String(e) })
      } finally {
        setLoading(false)
      }
    })()
  }, [isCreator])

  if (!isCreator) {
    return (
      <div style={{ padding: 20, maxWidth: 840, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, Roboto, sans-serif' }}>
        <div style={{ background: '#071027', color: '#dbeafe', padding: 16, borderRadius: 8, boxShadow: '0 8px 24px rgba(2,6,23,0.6)' }}>
          <h2 style={{ marginTop: 0 }}>Admin Status</h2>
          <p>You are not connected as the platform creator. Showing public status only.</p>

          <div style={{ display: 'flex', gap: 12, alignItems: 'center', marginTop: 8 }}>
            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <small style={{ color: '#94a3b8' }}>Compiled flag (src/constants.ts)</small>
              <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{String(COMPILED_ENABLE_CACHE_SYSTEM)}</div>
            </div>

            <div style={{ display: 'flex', flexDirection: 'column' }}>
              <small style={{ color: '#94a3b8' }}>Runtime override (window.__FEATURE_OVERRIDES__)</small>
              <div style={{ fontFamily: 'monospace', fontSize: 13 }}>{String((window as any).__FEATURE_OVERRIDES__?.ENABLE_CACHE_SYSTEM ?? '—')}</div>
            </div>

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 12, height: 12, borderRadius: 6, background: COMPILED_ENABLE_CACHE_SYSTEM ? '#16a34a' : '#dc2626', boxShadow: COMPILED_ENABLE_CACHE_SYSTEM ? '0 0 6px rgba(22,163,74,0.3)' : '0 0 6px rgba(220,38,38,0.3)' }} />
              <span style={{ color: '#9fb6c9', fontSize: 13 }}>CACHE (compiled)</span>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Helper: fetch safe (reads text then attempts to parse JSON)
  async function fetchSafe(url: string, opts?: RequestInit) {
    try {
      const res = await fetch(url, opts)
      const text = await res.text()
      try { return { ok: res.ok, status: res.status, body: JSON.parse(text) } } catch (e) { return { ok: res.ok, status: res.status, bodyText: text } }
    } catch (e) {
      return { ok: false, error: String(e) }
    }
  }

  const containerStyle: React.CSSProperties = { padding: 20, maxWidth: 1000, margin: '0 auto', fontFamily: 'Inter, system-ui, -apple-system, Roboto, sans-serif' }
  const cardStyle: React.CSSProperties = { background: '#0b1220', color: '#e6eef8', padding: 16, borderRadius: 8, boxShadow: '0 6px 18px rgba(2,6,23,0.6)' }
  const controlsStyle: React.CSSProperties = { display: 'flex', gap: 8, flexWrap: 'wrap', marginTop: 12 }
  const buttonStyle: React.CSSProperties = { padding: '8px 12px', background: '#0ea5a3', color: '#042027', border: 'none', borderRadius: 6, cursor: 'pointer' }
  const preStyle: React.CSSProperties = { whiteSpace: 'pre-wrap', background: '#041025', padding: 12, borderRadius: 6, marginTop: 10, fontFamily: 'monospace', fontSize: 13 }

  return (
    <div style={containerStyle}>
      <div style={cardStyle}>
        <h2 style={{ marginTop: 0 }}>Admin Dashboard</h2>
        {loading && <p>Loading...</p>}
        {!loading && data && <pre style={preStyle}>{JSON.stringify(data, null, 2)}</pre>}

        <div style={{ marginTop: 20 }}>
          <h3 style={{ marginBottom: 8 }}>Controls</h3>
          <div style={controlsStyle}>
            <button style={buttonStyle} onClick={async () => {
              setRateStatus(null)
              const res = await fetchSafe('/api/admin/rate-status', { headers: { 'x-admin-key': (window as any).__ADMIN_KEY__ || '', 'x-wallet-address': (window as any).__WALLET_ADDRESS__ || '' } })
              setRateStatus(res)
              setModalContent({ type: 'rateStatus', payload: res })
              setModalOpen(true)
            }}>Fetch Rate Limiter Status</button>

            <button style={{ ...buttonStyle, background: '#ef4444' }} onClick={async () => {
              setCacheClearResult(null)
              const res = await fetchSafe('/api/admin/cache-clear', { method: 'POST', headers: { 'x-admin-key': (window as any).__ADMIN_KEY__ || '', 'x-wallet-address': (window as any).__WALLET_ADDRESS__ || '' } })
              setCacheClearResult(res)
              setModalContent({ type: 'cacheClear', payload: res })
              setModalOpen(true)
            }}>Clear Server Cache</button>

            <button style={buttonStyle} onClick={async () => {
              setSmartCacheStats(null)
              const res = await fetchSafe('/api/admin/smart-cache-stats', { headers: { 'x-admin-key': (window as any).__ADMIN_KEY__ || '', 'x-wallet-address': (window as any).__WALLET_ADDRESS__ || '' } })
              setSmartCacheStats(res)
              setModalContent({ type: 'smartCache', payload: res })
              setModalOpen(true)
            }}>Smart Cache Stats</button>

            <button style={buttonStyle} onClick={async () => {
              setWarmResult(null)
              const res = await fetchSafe('/api/admin/smart-cache-warm', { method: 'POST', headers: { 'x-admin-key': (window as any).__ADMIN_KEY__ || '', 'x-wallet-address': (window as any).__WALLET_ADDRESS__ || '' } })
              setWarmResult(res)
              setModalContent({ type: 'smartWarm', payload: res })
              setModalOpen(true)
            }}>Warm Smart Cache</button>

            <button style={{ ...buttonStyle, background: '#6366f1' }} onClick={async () => {
              // RPC health
              const res = await fetchSafe('/api/monitoring/rpc-health')
              setModalContent({ type: 'rpcHealth', payload: res })
              setModalOpen(true)
            }}>Run RPC Health</button>
          </div>

          {/* Summary line — shows last action status, details available in modal */}
          <div style={{ marginTop: 12, color: '#9fb6c9', fontSize: 13 }}>
            <span>Last action results are shown in the Details modal. Use buttons above to perform admin actions.</span>
          </div>

          {/* Supabase admin controls (only shown if compiled flag enabled) */}
          {ENABLE_SUPABASE_AUTH && (
            <div style={{ marginTop: 20 }}>
              <h3 style={{ marginBottom: 8 }}>Supabase Admin</h3>
              <div style={controlsStyle}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input placeholder="Announcement title" value={announcementTitle} onChange={e => setAnnouncementTitle(e.target.value)} />
                  <textarea placeholder="Announcement body" value={announcementBody} onChange={e => setAnnouncementBody(e.target.value)} style={{ minHeight: 80 }} />
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button style={buttonStyle} onClick={async () => {
                      const res = await fetchSafe('/api/admin/announcements', { method: 'POST', headers: { 'Content-Type': 'application/json', 'x-admin-key': (window as any).__ADMIN_KEY__ || '' }, body: JSON.stringify({ title: announcementTitle, body: announcementBody, active: true }) })
                      setModalContent(res)
                      setModalOpen(true)
                    }}>Create Announcement</button>

                    <button style={{ ...buttonStyle, background: '#ef4444' }} onClick={async () => {
                      // fetch latest announcements and delete the first (most recent) for convenience
                      const list = await fetchSafe('/api/admin/announcements')
                      const id = list?.body?.data?.[0]?.id
                      if (!id) { setModalContent({ error: 'no announcement to delete' }); setModalOpen(true); return }
                      const del = await fetchSafe(`/api/admin/announcements?id=${encodeURIComponent(id)}`, { method: 'DELETE', headers: { 'x-admin-key': (window as any).__ADMIN_KEY__ || '' } })
                      setModalContent(del)
                      setModalOpen(true)
                    }}>Delete Latest Announcement</button>

                    <button style={buttonStyle} onClick={async () => {
                      const res = await fetchSafe('/api/admin/users', { headers: { 'x-admin-key': (window as any).__ADMIN_KEY__ || '', 'x-wallet-address': (window as any).__WALLET_ADDRESS__ || '' } })
                      setUsersList(res?.body?.data?.users ?? [])
                      setModalContent({ type: 'users', payload: res })
                      setModalOpen(true)
                    }}>List Users</button>

                    <button style={buttonStyle} onClick={async () => {
                      const res = await fetchSafe('/api/admin/feature-flags', { headers: { 'x-admin-key': (window as any).__ADMIN_KEY__ || '', 'x-wallet-address': (window as any).__WALLET_ADDRESS__ || '' } })
                      setFeatureFlags(res?.body?.data ?? [])
                      setModalContent({ type: 'featureFlags', payload: res })
                      setModalOpen(true)
                    }}>Get Feature Flags</button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Render the admin content inside the shared AdminModal (matches Leaderboard/Wallet UX) */}
      <AdminModal open={modalOpen} onClose={() => { setModalOpen(false); setModalContent(null) }} content={modalContent} />
    </div>
  )
}

function isLikelySource(text?: string) {
  if (!text) return false
  const t = text.trim()
  return t.startsWith('import ') || t.startsWith('//') || t.includes('sourceMappingURL') || t.includes('export default') || t.includes('export const config')
}

function ResultBlock({ res, onOpen }: { res: any, onOpen?: () => void }) {
  const preStyleLocal: React.CSSProperties = { whiteSpace: 'pre-wrap', background: '#041025', padding: 12, borderRadius: 6, marginTop: 10, fontFamily: 'monospace', fontSize: 13 }
  const localButtonStyle: React.CSSProperties = { padding: '8px 12px', background: '#0ea5a3', color: '#042027', border: 'none', borderRadius: 6, cursor: 'pointer' }

  if (!res) return null

  // If the response contains raw bodyText that looks like source, show a helpful diagnostic
  if (typeof res.bodyText === 'string' && isLikelySource(res.bodyText)) {
    return (
      <div style={{ marginTop: 10 }}>
        <div style={{ padding: 12, borderRadius: 8, background: '#3b0826', color: '#ffdde0' }}>
          <strong>Notice:</strong> The API returned raw function source (TypeScript/JS) instead of executing the API.
          This usually means your local API dev server (Edge functions) isn't running. Start the dev server to have endpoints execute.
        </div>

        <div style={{ marginTop: 8, fontSize: 13 }}>
          <div style={{ color: '#9fb6c9', marginBottom: 6 }}>Run these commands in a separate terminal (macOS / zsh):</div>
          <pre style={{ ...preStyleLocal, background: '#02111a' }}>{`# install vercel if you don't have it
npm i -g vercel
# run local API + edge function dev server
vercel dev

# keep your front-end dev server running (in another terminal)
npm run dev`}</pre>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 8 }}>
          <button style={{ ...localButtonStyle, background: '#0ea5a3' }} onClick={() => { navigator.clipboard.writeText(res.bodyText || '') }}>Copy Source</button>
          <a style={{ textDecoration: 'none' }} href={`data:text/plain;charset=utf-8,${encodeURIComponent(res.bodyText || '')}`} download="api-source.txt">
            <button style={{ ...localButtonStyle, background: '#0b74b6' }}>Download Source</button>
          </a>
          {onOpen && <button style={{ ...localButtonStyle, background: '#f59e0b' }} onClick={onOpen}>Open Details</button>}
        </div>

        <div style={preStyleLocal}>{res.bodyText.slice(0, 4000)}</div>
      </div>
    )
  }

  // If it's a normal parsed body
  if (res.body) {
    return (
      <div style={{ marginTop: 8 }}>
        <div style={{ display: 'flex', gap: 8 }}>
          <button style={{ ...localButtonStyle, background: '#0ea5a3' }} onClick={() => { navigator.clipboard.writeText(JSON.stringify(res.body, null, 2)) }}>Copy JSON</button>
          <a style={{ textDecoration: 'none' }} href={`data:application/json;charset=utf-8,${encodeURIComponent(JSON.stringify(res.body, null, 2))}`} download="result.json">
            <button style={{ ...localButtonStyle, background: '#0b74b6' }}>Download JSON</button>
          </a>
          {onOpen && <button style={{ ...localButtonStyle, background: '#f59e0b' }} onClick={onOpen}>Open Details</button>}
        </div>
        <pre style={preStyleLocal}>{JSON.stringify(res.body, null, 2)}</pre>
      </div>
    )
  }

  if (res.bodyText) {
    return <pre style={preStyleLocal}>{res.bodyText}</pre>
  }

  if (res.error) {
    return <pre style={preStyleLocal}>{`Error: ${String(res.error)}`}</pre>
  }

  return <pre style={preStyleLocal}>{JSON.stringify(res, null, 2)}</pre>
}
