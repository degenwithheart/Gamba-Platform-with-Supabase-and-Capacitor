import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import { ENABLE_SUPABASE_AUTH } from '../constants'
import type { UserRelationship, SocialUser } from '../types/social'

export function useSocialFeatures() {
  const { user } = useAuth()
  const [relationships, setRelationships] = useState<UserRelationship[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Get user relationships
  const fetchRelationships = useCallback(async () => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('user_relationships')
        .select('*')
        .or(`follower_id.eq.${user.id},following_id.eq.${user.id}`)
        .order('created_at', { ascending: false })

      if (error) throw error
      setRelationships(data || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [user?.id])

  // Follow a user
  const followUser = useCallback(async (userId: string) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id || userId === user.id) return

    try {
      const { error } = await supabase
        .from('user_relationships')
        .insert({
          follower_id: user.id,
          following_id: userId,
          relationship_type: 'follow',
          status: 'accepted' // Auto-accept follows
        })

      if (error) throw error
      await fetchRelationships()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id, fetchRelationships])

  // Send friend request
  const sendFriendRequest = useCallback(async (userId: string) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id || userId === user.id) return

    try {
      const { error } = await supabase
        .from('user_relationships')
        .insert({
          follower_id: user.id,
          following_id: userId,
          relationship_type: 'friend',
          status: 'pending'
        })

      if (error) throw error
      await fetchRelationships()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id, fetchRelationships])

  // Accept friend request
  const acceptFriendRequest = useCallback(async (relationshipId: string) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return

    try {
      const { error } = await supabase
        .from('user_relationships')
        .update({ status: 'accepted' })
        .eq('id', relationshipId)
        .eq('following_id', user.id) // Only the recipient can accept

      if (error) throw error
      await fetchRelationships()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id, fetchRelationships])

  // Unfollow/unfriend user
  const removeRelationship = useCallback(async (userId: string) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return

    try {
      const { error } = await supabase
        .from('user_relationships')
        .delete()
        .or(`and(follower_id.eq.${user.id},following_id.eq.${userId}),and(follower_id.eq.${userId},following_id.eq.${user.id})`)

      if (error) throw error
      await fetchRelationships()
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id, fetchRelationships])

  // Get social users (search/discover)
  const searchUsers = useCallback(async (query: string): Promise<SocialUser[]> => {
    if (!ENABLE_SUPABASE_AUTH || !query.trim()) return []

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id, username, avatar_url, bio')
        .ilike('username', `%${query}%`)
        .limit(20)

      if (error) throw error

      // Add relationship status for each user
      const usersWithStatus = await Promise.all(
        (data || []).map(async (profile) => {
          if (!user?.id || profile.id === user.id) {
            return { ...profile, relationship_status: 'none' as const }
          }

          const relationship = relationships.find(
            r => (r.follower_id === user.id && r.following_id === profile.id) ||
                 (r.follower_id === profile.id && r.following_id === user.id)
          )

          let status: SocialUser['relationship_status'] = 'none'
          if (relationship) {
            if (relationship.relationship_type === 'friend') {
              status = relationship.status === 'accepted' ? 'friend' : 'pending'
            } else {
              status = 'following'
            }
          }

          return { ...profile, relationship_status: status }
        })
      )

      return usersWithStatus
    } catch (err: any) {
      setError(err.message)
      return []
    }
  }, [user?.id, relationships])

  // Get user's social stats
  const getSocialStats = useCallback(async (userId?: string) => {
    if (!ENABLE_SUPABASE_AUTH) return null
    const targetUserId = userId || user?.id
    if (!targetUserId) return null

    try {
      const [followersRes, followingRes] = await Promise.all([
        supabase
          .from('user_relationships')
          .select('id', { count: 'exact' })
          .eq('following_id', targetUserId)
          .eq('status', 'accepted'),
        
        supabase
          .from('user_relationships')
          .select('id', { count: 'exact' })
          .eq('follower_id', targetUserId)
          .eq('status', 'accepted')
      ])

      return {
        followers_count: followersRes.count || 0,
        following_count: followingRes.count || 0
      }
    } catch (err: any) {
      setError(err.message)
      return null
    }
  }, [user?.id])

  useEffect(() => {
    if (ENABLE_SUPABASE_AUTH && user?.id) {
      fetchRelationships()
    }
  }, [user?.id, fetchRelationships])

  return {
    // Data
    relationships,
    loading,
    error,
    
    // Actions
    followUser,
    sendFriendRequest,
    acceptFriendRequest,
    removeRelationship,
    searchUsers,
    getSocialStats,
    
    // Utils
    clearError: () => setError(null),
    refresh: fetchRelationships
  }
}