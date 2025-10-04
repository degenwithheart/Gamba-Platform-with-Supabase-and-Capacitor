import React, { useCallback, useEffect, useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { useAuth } from './useAuth'
import { supabase } from '../lib/supabaseClient'
import { ENABLE_SUPABASE_AUTH } from '../constants'

export function useWalletAuth() {
  const wallet = useWallet()
  const { user: supabaseUser } = useAuth()
  const [isLinking, setIsLinking] = useState(false)
  const [needsSignup, setNeedsSignup] = useState(false)
  const [linkingError, setLinkingError] = useState<string | null>(null)

  // Check if current user has wallet linked (simplified approach)
  const checkWalletLink = useCallback(async (walletAddress: string) => {
    if (!ENABLE_SUPABASE_AUTH) return { linked: true, user: null }
    
    try {
      // If user is logged in, check if their wallet matches
      if (supabaseUser) {
        const userWallet = supabaseUser.user_metadata?.wallet_address
        return { 
          linked: userWallet === walletAddress, 
          user: supabaseUser 
        }
      }
      
      // If no user logged in, wallet is not linked
      return { linked: false, user: null }
    } catch (error) {
      console.error('Error in checkWalletLink:', error)
      return { linked: false, user: null, error: 'Failed to check wallet link' }
    }
  }, [supabaseUser])

  // Link current wallet to existing Supabase user
  const linkWalletToUser = useCallback(async () => {
    if (!ENABLE_SUPABASE_AUTH || !wallet.publicKey || !supabaseUser) return

    try {
      setIsLinking(true)
      setLinkingError(null)

      // Update user metadata with wallet address
      const { error } = await supabase.auth.updateUser({
        data: { 
          wallet_address: wallet.publicKey.toBase58(),
          linked_at: new Date().toISOString()
        }
      })

      if (error) {
        setLinkingError(error.message)
        return false
      }

      return true
    } catch (error) {
      console.error('Error linking wallet:', error)
      setLinkingError('Failed to link wallet to account')
      return false
    } finally {
      setIsLinking(false)
    }
  }, [wallet.publicKey, supabaseUser])

  // Create account with wallet address
  const createAccountWithWallet = useCallback(async (email: string, password: string) => {
    if (!ENABLE_SUPABASE_AUTH || !wallet.publicKey) return

    try {
      setIsLinking(true)
      setLinkingError(null)

      const { error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            wallet_address: wallet.publicKey.toBase58(),
            created_with_wallet: true
          }
        }
      })

      if (error) {
        setLinkingError(error.message)
        return false
      }

      setNeedsSignup(false)
      return true
    } catch (error) {
      console.error('Error creating account:', error)
      setLinkingError('Failed to create account')
      return false
    } finally {
      setIsLinking(false)
    }
  }, [wallet.publicKey])

  // Check wallet link status when wallet connects
  useEffect(() => {
    const checkLink = async () => {
      if (!ENABLE_SUPABASE_AUTH || !wallet.connected || !wallet.publicKey) {
        setNeedsSignup(false)
        return
      }

      const { linked } = await checkWalletLink(wallet.publicKey.toBase58())
      
      // If wallet is not linked and user is not logged in, require signup
      if (!linked && !supabaseUser) {
        setNeedsSignup(true)
      } else {
        setNeedsSignup(false)
      }
    }

    checkLink()
  }, [wallet.connected, wallet.publicKey, supabaseUser, checkWalletLink])

  // Auto-link wallet if user is logged in but wallet not linked
  useEffect(() => {
    const autoLink = async () => {
      if (!ENABLE_SUPABASE_AUTH || !wallet.connected || !wallet.publicKey || !supabaseUser) {
        return
      }

      // Check if current user already has this wallet linked
      const currentUserWallet = supabaseUser.user_metadata?.wallet_address
      if (currentUserWallet !== wallet.publicKey.toBase58()) {
        await linkWalletToUser()
      }
    }

    autoLink()
  }, [wallet.connected, wallet.publicKey, supabaseUser, linkWalletToUser])

  const isWalletAuthRequired = ENABLE_SUPABASE_AUTH && wallet.connected && needsSignup
  const canPlay = !ENABLE_SUPABASE_AUTH || (wallet.connected && (!needsSignup || supabaseUser))

  return {
    // State
    isLinking,
    needsSignup,
    linkingError,
    canPlay,
    isWalletAuthRequired,
    
    // Actions  
    createAccountWithWallet,
    linkWalletToUser,
    checkWalletLink,
    
    // Clear states
    clearError: () => setLinkingError(null),
    clearSignupRequired: () => setNeedsSignup(false)
  }
}