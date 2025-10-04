import React, { useState } from 'react'
import { useWallet } from '@solana/wallet-adapter-react'
import { Modal } from './Modal'
import { GambaUi } from 'gamba-react-ui-v2'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { supabase } from '../lib/supabaseClient'
import { truncateString } from '../utils'

type Props = {
  open: boolean
  onClose: () => void
  onSuccess?: () => void
}

export function WalletAuthModal({ open, onClose, onSuccess }: Props) {
  const wallet = useWallet()
  const { createAccountWithWallet, linkWalletToUser, isLinking, linkingError, clearError } = useWalletAuth()
  const [mode, setMode] = useState<'signup' | 'login'>('signup')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const handleSignup = async () => {
    if (!email || !password) return
    
    setLoading(true)
    setError(null)
    clearError()

    const success = await createAccountWithWallet(email, password)
    
    if (success) {
      onSuccess?.()
      onClose()
    } else {
      setError(linkingError || 'Failed to create account')
    }
    
    setLoading(false)
  }

  const handleLogin = async () => {
    if (!email || !password) return
    
    setLoading(true)
    setError(null)
    
    try {
      const { error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      if (error) {
        setError(error.message)
      } else {
        // After login, link the wallet
        const linkSuccess = await linkWalletToUser()
        if (linkSuccess) {
          onSuccess?.()
          onClose()
        } else {
          setError(linkingError || 'Failed to link wallet to account')
        }
      }
    } catch (err) {
      setError('Login failed')
    }
    
    setLoading(false)
  }



  const isFormDisabled = loading || isLinking

  return (
    // @ts-ignore - Modal component children props issue
    <Modal onClose={onClose}>
      <div style={{ textAlign: 'center', marginBottom: '20px' }}>
        <h2 style={{ margin: '0 0 10px', color: '#fff' }}>
          Account Required
        </h2>
        
        <div style={{ 
          padding: '10px', 
          background: 'rgba(110, 86, 207, 0.1)', 
          borderRadius: '8px',
          border: '1px solid rgba(110, 86, 207, 0.3)',
          marginBottom: '20px'
        }}>
          <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '5px' }}>
            Connecting wallet:
          </div>
          <div style={{ fontSize: '16px', color: '#fff', fontFamily: 'monospace' }}>
            {wallet.publicKey ? truncateString(wallet.publicKey.toBase58(), 6, 6) : 'Unknown'}
          </div>
        </div>

        <p style={{ color: '#ccc', fontSize: '14px', margin: '0 0 20px' }}>
          To play on this platform, you need to {mode === 'signup' ? 'create an account' : 'sign in'} and 
          link it to your wallet for enhanced security and features.
        </p>
      </div>

      <div style={{ display: 'grid', gap: 12 }}>
        <input
          style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #333', 
            background: '#1a1a1a', 
            color: 'white',
            fontSize: '14px'
          }}
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={isFormDisabled}
        />
        
        <input
          style={{ 
            padding: '12px', 
            borderRadius: '8px', 
            border: '1px solid #333', 
            background: '#1a1a1a', 
            color: 'white',
            fontSize: '14px'
          }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isFormDisabled}
        />

        {error && (
          <div style={{ 
            color: '#ff6b6b', 
            fontSize: '12px', 
            padding: '8px',
            background: 'rgba(255, 107, 107, 0.1)',
            borderRadius: '4px',
            border: '1px solid rgba(255, 107, 107, 0.3)'
          }}>
            {error}
          </div>
        )}

        <GambaUi.Button
          main
          onClick={mode === 'signup' ? handleSignup : handleLogin}
          disabled={isFormDisabled || !email || !password}
        >
          {isFormDisabled ? 'Processing...' : mode === 'signup' ? 'Create Account & Link Wallet' : 'Sign In & Link Wallet'}
        </GambaUi.Button>



        <button
          style={{ 
            padding: '8px 0', 
            background: 'transparent', 
            color: '#888', 
            border: '0', 
            cursor: 'pointer',
            fontSize: '12px'
          }}
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          disabled={isFormDisabled}
        >
          {mode === 'signup' 
            ? 'Already have an account? Sign in' 
            : "Don't have an account? Sign up"
          }
        </button>
      </div>
    </Modal>
  )
}