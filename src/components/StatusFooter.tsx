import React, { useEffect, useState } from 'react'
import { ENABLE_SUPABASE_AUTH, ENABLE_CACHE_SYSTEM, ENABLE_COMPREHENSIVE_ERROR_SYSTEM, ENABLE_MOBILE_APP } from '../constants'

const Indicator: React.FC<{ label: string; on: boolean }> = ({ label, on }) => (
  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
    <div style={{ width: 12, height: 12, borderRadius: 6, background: on ? '#16a34a' : '#dc2626', boxShadow: on ? '0 0 6px rgba(22,163,74,0.3)' : '0 0 6px rgba(220,38,38,0.3)' }} />
    <span style={{ fontSize: 12, color: '#cbd5e1' }}>{label}</span>
  </div>
)

export default function StatusFooter() {
  // The flags are static values imported from constants, but the user requested a live indicator.
  // We'll poll once a second to pick up any runtime toggles (for example via window.__OVERRIDES__ or dev tools).
  const [state, setState] = useState({
    supabase: ENABLE_SUPABASE_AUTH,
    cache: ENABLE_CACHE_SYSTEM,
    comp: ENABLE_COMPREHENSIVE_ERROR_SYSTEM,
    mobile: ENABLE_MOBILE_APP,
  })

  useEffect(() => {
    const id = setInterval(() => {
      // Allow runtime overrides via window.__FEATURE_OVERRIDES__ for testing
      const overrides = (window as any).__FEATURE_OVERRIDES__ || {}
      setState({
        supabase: overrides.ENABLE_SUPABASE_AUTH ?? ENABLE_SUPABASE_AUTH,
        cache: overrides.ENABLE_CACHE_SYSTEM ?? ENABLE_CACHE_SYSTEM,
        comp: overrides.ENABLE_COMPREHENSIVE_ERROR_SYSTEM ?? ENABLE_COMPREHENSIVE_ERROR_SYSTEM,
        mobile: overrides.ENABLE_MOBILE_APP ?? ENABLE_MOBILE_APP,
      })
    }, 1000)
    return () => clearInterval(id)
  }, [])

  return (
    <footer style={{ position: 'fixed', left: 12, right: 12, bottom: 12, display: 'flex', justifyContent: 'center', gap: 12, zIndex: 9999 }}>
      <div style={{ background: 'rgba(15,23,42,0.8)', padding: '8px 12px', borderRadius: 8, display: 'flex', gap: 12, alignItems: 'center', boxShadow: '0 6px 20px rgba(2,6,23,0.6)' }}>
        <Indicator label="SUPABASE_AUTH" on={state.supabase} />
        <Indicator label="CACHE" on={state.cache} />
        <Indicator label="COMPREHENSIVE_ERR" on={state.comp} />
        <Indicator label="MOBILE_APP" on={state.mobile} />
      </div>
    </footer>
  )
}
