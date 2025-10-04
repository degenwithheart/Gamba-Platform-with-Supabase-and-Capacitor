import { ENABLE_COMPREHENSIVE_ERROR_SYSTEM } from '../constants'

async function sendReport(payload: any) {
  try {
    if (!ENABLE_COMPREHENSIVE_ERROR_SYSTEM) return
    await fetch('/api/monitoring/report-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
  } catch (e) {
    // swallow errors to avoid infinite loops
    console.warn('Failed to send monitoring report', e)
  }
}

export function installGlobalErrorReporting() {
  if (typeof window === 'undefined') return

  // window.onerror
  window.addEventListener('error', (ev) => {
    try {
      const payload = {
        kind: 'error',
        message: (ev.error && ev.error.message) || ev.message || String(ev.error || ev.message),
        stack: ev.error ? ev.error.stack : undefined,
        filename: (ev.filename as any) || undefined,
        lineno: (ev as any).lineno,
        colno: (ev as any).colno,
        time: Date.now()
      }
      void sendReport(payload)
    } catch (e) {}
  })

  // unhandledrejection
  window.addEventListener('unhandledrejection', (ev) => {
    try {
      const reason = ev.reason
      const payload = {
        kind: 'unhandledrejection',
        message: reason && reason.message ? reason.message : String(reason),
        stack: reason && reason.stack ? reason.stack : undefined,
        time: Date.now()
      }
      void sendReport(payload)
    } catch (e) {}
  })

  // Wrap fetch to catch network errors
  const originalFetch = window.fetch.bind(window)
  // @ts-ignore
  window.fetch = async (...args: any[]) => {
    try {
      const res = await (originalFetch as any)(...args)
      if (!res.ok) {
        // capture non-2xx responses
        const text = await res.text().catch(() => '')
        void sendReport({ kind: 'fetch-error', status: res.status, url: (args[0] && String(args[0])) || '', body: text, time: Date.now() })
      }
      return res
    } catch (e) {
      void sendReport({ kind: 'fetch-exception', error: String(e), args: args.slice(0,2), time: Date.now() })
      throw e
    }
  }
}

export default installGlobalErrorReporting
