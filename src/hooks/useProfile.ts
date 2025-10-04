import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import type { Profile } from '../types/profile'

export function useProfile(userId: string | undefined) {
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const refresh = useCallback(async () => {
    if (!userId) {
      setProfile(null)
      return
    }
    setLoading(true)
    setError(null)
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', userId)
      .maybeSingle()

    if (error) {
      setError(error.message)
    } else {
      setProfile((data as Profile) ?? null)
    }
    setLoading(false)
  }, [userId])

  useEffect(() => {
    refresh()
  }, [refresh])

  const upsert = useCallback(
    async (payload: Omit<Profile, 'id'>) => {
      if (!userId) return { error: new Error('No user id') }
      const { error } = await supabase
        .from('profiles')
        .upsert({ id: userId, ...payload }, { onConflict: 'id' })
      if (!error) await refresh()
      return { error }
    },
    [refresh, userId],
  )

  return { profile, loading, error, refresh, upsert }
}