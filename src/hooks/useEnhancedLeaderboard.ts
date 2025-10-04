import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import { ENABLE_SUPABASE_AUTH } from '../constants'
import type { UserStats } from '../types/social'

export type LeaderboardPeriod = 'daily' | 'weekly' | 'monthly' | 'all-time'
export type LeaderboardType = 'wagered' | 'winnings' | 'games' | 'biggest-win'

export function useEnhancedLeaderboard() {
  const { user } = useAuth()
  const [leaderboard, setLeaderboard] = useState<UserStats[]>([])
  const [userStats, setUserStats] = useState<UserStats[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Record user game statistics
  const recordGameStats = useCallback(async (gameData: {
    game_id: string
    wagered: number
    winnings: number
    biggest_win?: number
    biggest_loss?: number
  }) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return

    try {
      const { error } = await supabase.rpc('update_user_stats', {
        p_user_id: user.id,
        p_game_id: gameData.game_id,
        p_wagered: gameData.wagered,
        p_winnings: gameData.winnings,
        p_biggest_win: gameData.biggest_win || 0,
        p_biggest_loss: gameData.biggest_loss || 0
      })

      if (error) throw error
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id])

  // Fetch leaderboard data
  const fetchLeaderboard = useCallback(async (
    period: LeaderboardPeriod = 'weekly',
    type: LeaderboardType = 'wagered',
    gameId?: string,
    limit: number = 50
  ) => {
    if (!ENABLE_SUPABASE_AUTH) return

    try {
      setLoading(true)
      
      let dateFilter = ''
      const now = new Date()
      
      switch (period) {
        case 'daily':
          const today = new Date(now.getFullYear(), now.getMonth(), now.getDate())
          dateFilter = `last_played_at >= '${today.toISOString()}'`
          break
        case 'weekly':
          const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
          dateFilter = `last_played_at >= '${weekStart.toISOString()}'`
          break
        case 'monthly':
          const monthStart = new Date(now.getFullYear(), now.getMonth(), 1)
          dateFilter = `last_played_at >= '${monthStart.toISOString()}'`
          break
        case 'all-time':
        default:
          dateFilter = 'true'
          break
      }

      let orderBy = ''
      switch (type) {
        case 'wagered':
          orderBy = 'total_wagered desc'
          break
        case 'winnings':
          orderBy = 'total_winnings desc'
          break
        case 'games':
          orderBy = 'games_played desc'
          break
        case 'biggest-win':
          orderBy = 'biggest_win desc'
          break
      }

      let query = supabase
        .from('user_stats')
        .select(`
          *,
          profiles!user_id (
            id,
            username,
            avatar_url
          )
        `)
        .order(orderBy.split(' ')[0], { ascending: false })
        .limit(limit)

      if (gameId) {
        query = query.eq('game_id', gameId)
      }

      // Apply date filter if not all-time
      if (period !== 'all-time') {
        // For now, we'll use a simple approach since Supabase filtering on computed dates is complex
        // In production, you might want to add a trigger to update daily/weekly/monthly aggregation tables
      }

      const { data, error } = await query

      if (error) throw error

      const statsWithProfiles = (data || []).map(stat => ({
        ...stat,
        user: stat.profiles ? {
          id: stat.profiles.id,
          username: stat.profiles.username || 'Anonymous',
          avatar_url: stat.profiles.avatar_url
        } : undefined
      }))

      setLeaderboard(statsWithProfiles)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Fetch user's personal stats
  const fetchUserStats = useCallback(async (userId?: string) => {
    if (!ENABLE_SUPABASE_AUTH) return
    const targetUserId = userId || user?.id
    if (!targetUserId) return

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select(`
          *,
          profiles!user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('user_id', targetUserId)
        .order('total_wagered', { ascending: false })

      if (error) throw error

      const statsWithProfiles = (data || []).map(stat => ({
        ...stat,
        user: stat.profiles ? {
          id: stat.profiles.id,
          username: stat.profiles.username || 'Anonymous',
          avatar_url: stat.profiles.avatar_url
        } : undefined
      }))

      setUserStats(statsWithProfiles)
    } catch (err: any) {
      setError(err.message)
    }
  }, [user?.id])

  // Get user's rank in a specific leaderboard
  const getUserRank = useCallback(async (
    type: LeaderboardType = 'wagered',
    gameId?: string
  ) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return null

    try {
      let orderColumn = ''
      switch (type) {
        case 'wagered':
          orderColumn = 'total_wagered'
          break
        case 'winnings':
          orderColumn = 'total_winnings'
          break
        case 'games':
          orderColumn = 'games_played'
          break
        case 'biggest-win':
          orderColumn = 'biggest_win'
          break
      }

      // Get user's stats
      let userQuery = supabase
        .from('user_stats')
        .select(orderColumn)
        .eq('user_id', user.id)

      if (gameId) {
        userQuery = userQuery.eq('game_id', gameId)
      }

      const { data: userData, error: userError } = await userQuery.single()
      if (userError || !userData) return null

      const userValue = userData[orderColumn]

      // Count how many users have better stats
      let rankQuery = supabase
        .from('user_stats')
        .select('user_id', { count: 'exact' })
        .gt(orderColumn, userValue)

      if (gameId) {
        rankQuery = rankQuery.eq('game_id', gameId)
      }

      const { count, error: rankError } = await rankQuery

      if (rankError) throw rankError

      return (count || 0) + 1 // Rank is count of better players + 1
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [user?.id])

  // Get aggregated stats for a user
  const getAggregatedStats = useCallback(async (userId?: string) => {
    if (!ENABLE_SUPABASE_AUTH) return null
    const targetUserId = userId || user?.id
    if (!targetUserId) return null

    try {
      const { data, error } = await supabase
        .from('user_stats')
        .select('total_wagered, total_winnings, games_played, biggest_win')
        .eq('user_id', targetUserId)

      if (error) throw error

      const stats = data || []
      
      return {
        total_wagered: stats.reduce((sum, s) => sum + (s.total_wagered || 0), 0),
        total_winnings: stats.reduce((sum, s) => sum + (s.total_winnings || 0), 0),
        total_games: stats.reduce((sum, s) => sum + (s.games_played || 0), 0),
        biggest_win: Math.max(...stats.map(s => s.biggest_win || 0), 0),
        win_rate: stats.length > 0 ? 
          stats.reduce((sum, s) => sum + (s.total_winnings || 0), 0) / 
          stats.reduce((sum, s) => sum + (s.total_wagered || 0), 0) : 0
      }
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [user?.id])

  return {
    // Data
    leaderboard,
    userStats,
    loading,
    error,
    
    // Actions
    recordGameStats,
    fetchLeaderboard,
    fetchUserStats,
    getUserRank,
    getAggregatedStats,
    
    // Utils
    clearError: () => setError(null)
  }
}

// SQL function to upsert user stats (run this in Supabase)
export const USER_STATS_SQL_FUNCTION = `
CREATE OR REPLACE FUNCTION update_user_stats(
  p_user_id UUID,
  p_game_id TEXT,
  p_wagered DECIMAL(20,8),
  p_winnings DECIMAL(20,8),
  p_biggest_win DECIMAL(20,8) DEFAULT 0,
  p_biggest_loss DECIMAL(20,8) DEFAULT 0
) RETURNS VOID AS $$
BEGIN
  INSERT INTO public.user_stats (
    user_id, 
    game_id, 
    total_wagered, 
    total_winnings, 
    games_played,
    biggest_win,
    biggest_loss,
    last_played_at
  )
  VALUES (
    p_user_id,
    p_game_id,
    p_wagered,
    p_winnings,
    1,
    GREATEST(p_biggest_win, p_winnings),
    GREATEST(p_biggest_loss, CASE WHEN p_winnings < 0 THEN ABS(p_winnings) ELSE 0 END),
    NOW()
  )
  ON CONFLICT (user_id, game_id) DO UPDATE SET
    total_wagered = user_stats.total_wagered + p_wagered,
    total_winnings = user_stats.total_winnings + p_winnings,
    games_played = user_stats.games_played + 1,
    biggest_win = GREATEST(user_stats.biggest_win, p_biggest_win, p_winnings),
    biggest_loss = GREATEST(user_stats.biggest_loss, p_biggest_loss, CASE WHEN p_winnings < 0 THEN ABS(p_winnings) ELSE 0 END),
    last_played_at = NOW(),
    updated_at = NOW();
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`