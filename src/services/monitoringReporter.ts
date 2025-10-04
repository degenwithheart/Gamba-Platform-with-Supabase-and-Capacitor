import { ENABLE_COMPREHENSIVE_ERROR_SYSTEM } from '../constants'

export async function reportClientError(payload: any) {
  try {
    if (!ENABLE_COMPREHENSIVE_ERROR_SYSTEM) return false
    await fetch('/api/monitoring/report-error', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload) })
    return true
  } catch (e) {
    console.error('Failed to report client error', e)
    return false
  }
}

export default reportClientError
