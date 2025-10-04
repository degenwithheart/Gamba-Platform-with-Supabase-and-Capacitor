import reportClientError from '../services/monitoringReporter'
import { useToast } from './useToast'

export type ReportingToastInput = { title: string; description: string; level?: 'info' | 'error' }

export function useReportingToast() {
  const toast = useToast()
  return (t: ReportingToastInput) => {
    try {
      if (t.level === 'error') {
        void reportClientError({ type: 'toast', title: t.title, description: t.description, timestamp: Date.now() })
      }
    } catch (e) {}
    toast({ title: t.title, description: t.description })
  }
}

export default useReportingToast
