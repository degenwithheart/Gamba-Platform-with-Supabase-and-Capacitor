import React, { useEffect, useState } from 'react'
import { useProfile } from '../hooks/useProfile'
import { getActiveAnnouncement, isAnnouncementDismissed, dismissAnnouncement } from '../services/announcements'

export function AnnouncementBanner() {
  const { profile } = useProfile(undefined)
  const userId = profile?.id
  const [announcement, setAnnouncement] = useState<any | null>(null)
  const [hidden, setHidden] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      setLoading(true)
      const { announcement: a, error } = await getActiveAnnouncement()
      if (error || !a) { setLoading(false); return }
      if (!mounted) return
      if (!userId) {
        setAnnouncement(a)
        setLoading(false)
        return
      }
      const { dismissed } = await isAnnouncementDismissed(userId, a.id)
      if (!mounted) return
      if (!dismissed) setAnnouncement(a)
      setLoading(false)
    })()
    return () => { mounted = false }
  }, [userId])

  async function onDismiss() {
    if (!announcement) return
    if (!userId) { setHidden(true); return }
    const { error } = await dismissAnnouncement(userId, announcement.id)
    if (!error) setHidden(true)
  }

  if (loading || hidden || !announcement) return null

  return (
    <div style={{ background: '#071627', color: '#e6f7ff', padding: 12, borderRadius: 6, marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
        <div>
          <strong>{announcement.title}</strong>
          <div style={{ marginTop: 6 }}>{announcement.body}</div>
        </div>
        <div>
          <button onClick={onDismiss} style={{ padding: '6px 10px', borderRadius: 6, background: '#ef4444', color: 'white', border: 'none' }}>Dismiss</button>
        </div>
      </div>
    </div>
  )
}
