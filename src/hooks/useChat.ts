import React, { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { useAuth } from './useAuth'
import { ENABLE_SUPABASE_AUTH } from '../constants'
import type { ChatMessage, DirectMessage } from '../types/social'

export function useChat() {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [directMessages, setDirectMessages] = useState<DirectMessage[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Fetch global chat messages
  const fetchMessages = useCallback(async (channel: string = 'global') => {
    if (!ENABLE_SUPABASE_AUTH) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('chat_messages')
        .select(`
          *,
          profiles!user_id (
            id,
            username,
            avatar_url
          )
        `)
        .eq('channel', channel)
        .order('created_at', { ascending: false })
        .limit(50)

      if (error) throw error

      const messagesWithUser = (data || []).map(msg => ({
        ...msg,
        user: msg.profiles ? {
          id: msg.profiles.id,
          username: msg.profiles.username || 'Anonymous',
          avatar_url: msg.profiles.avatar_url
        } : undefined
      })).reverse() // Show oldest first

      setMessages(messagesWithUser)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [])

  // Send message to global chat
  const sendMessage = useCallback(async (message: string, channel: string = 'global') => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id || !message.trim()) return

    try {
      const { error } = await supabase
        .from('chat_messages')
        .insert({
          user_id: user.id,
          message: message.trim(),
          channel
        })

      if (error) throw error
      
      // Refresh messages
      await fetchMessages(channel)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id, fetchMessages])

  // Fetch direct messages with a specific user
  const fetchDirectMessages = useCallback(async (otherUserId: string) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return

    try {
      const { data, error } = await supabase
        .from('direct_messages')
        .select(`
          *,
          sender:profiles!sender_id (
            id,
            username,
            avatar_url
          ),
          recipient:profiles!recipient_id (
            id,
            username,
            avatar_url
          )
        `)
        .or(`and(sender_id.eq.${user.id},recipient_id.eq.${otherUserId}),and(sender_id.eq.${otherUserId},recipient_id.eq.${user.id})`)
        .order('created_at', { ascending: true })
        .limit(100)

      if (error) throw error

      const dmsWithUsers = (data || []).map(dm => ({
        ...dm,
        sender: dm.sender ? {
          id: dm.sender.id,
          username: dm.sender.username || 'Anonymous',
          avatar_url: dm.sender.avatar_url
        } : undefined,
        recipient: dm.recipient ? {
          id: dm.recipient.id,
          username: dm.recipient.username || 'Anonymous',
          avatar_url: dm.recipient.avatar_url
        } : undefined
      }))

      setDirectMessages(dmsWithUsers)
    } catch (err: any) {
      setError(err.message)
    }
  }, [user?.id])

  // Send direct message
  const sendDirectMessage = useCallback(async (recipientId: string, message: string) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id || !message.trim() || recipientId === user.id) return

    try {
      const { error } = await supabase
        .from('direct_messages')
        .insert({
          sender_id: user.id,
          recipient_id: recipientId,
          message: message.trim()
        })

      if (error) throw error
      
      // Refresh DMs
      await fetchDirectMessages(recipientId)
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id, fetchDirectMessages])

  // Mark DM as read
  const markAsRead = useCallback(async (messageId: string) => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return

    try {
      const { error } = await supabase
        .from('direct_messages')
        .update({ read_at: new Date().toISOString() })
        .eq('id', messageId)
        .eq('recipient_id', user.id) // Only recipient can mark as read

      if (error) throw error
      return true
    } catch (err: any) {
      setError(err.message)
      return false
    }
  }, [user?.id])

  // Get unread message count
  const getUnreadCount = useCallback(async () => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return 0

    try {
      const { count, error } = await supabase
        .from('direct_messages')
        .select('*', { count: 'exact' })
        .eq('recipient_id', user.id)
        .is('read_at', null)

      if (error) throw error
      return count || 0
    } catch (err: any) {
      setError(err.message)
      return 0
    }
  }, [user?.id])

  // Subscribe to real-time updates
  useEffect(() => {
    if (!ENABLE_SUPABASE_AUTH || !user?.id) return

    const subscription = supabase
      .channel('chat')
      .on('postgres_changes', {
        event: 'INSERT',
        schema: 'public',
        table: 'chat_messages',
        filter: `channel=eq.global`
      }, (payload) => {
        // Add new message to the list
        fetchMessages('global')
      })
      .subscribe()

    // Initial load
    fetchMessages('global')

    return () => {
      subscription.unsubscribe()
    }
  }, [user?.id, fetchMessages])

  return {
    // Data
    messages,
    directMessages,
    loading,
    error,
    
    // Actions
    sendMessage,
    sendDirectMessage,
    markAsRead,
    fetchDirectMessages,
    getUnreadCount,
    
    // Utils
    clearError: () => setError(null),
    refresh: () => fetchMessages('global')
  }
}