import { supabase } from '../lib/supabaseClient'

export async function getActiveAnnouncement() {
  const { data, error } = await supabase.from('announcements').select('*').eq('active', true).order('created_at', { ascending: false }).limit(1).maybeSingle()
  if (error) return { error }
  return { announcement: data }
}

export async function isAnnouncementDismissed(userId: string, announcementId: string) {
  const { data, error } = await supabase.from('announcement_dismissals').select('*').eq('user_id', userId).eq('announcement_id', announcementId).maybeSingle()
  if (error) return { error }
  return { dismissed: !!data }
}

export async function dismissAnnouncement(userId: string, announcementId: string) {
  const { data, error } = await supabase.from('announcement_dismissals').upsert({ user_id: userId, announcement_id: announcementId }, { onConflict: 'user_id,announcement_id' }).select()
  if (error) return { error }
  return { data: data?.[0] }
}
