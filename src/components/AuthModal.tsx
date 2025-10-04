import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'
import { Modal } from './Modal'

type Props = {
  open: boolean
  onClose: () => void
}

export function AuthModal({ open, onClose }: Props) {
  const [mode, setMode] = useState<'login' | 'signup'>('login')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const submit = async () => {
    setLoading(true)
    setError(null)
    const action =
      mode === 'signup'
        ? supabase.auth.signUp({ email, password })
        : supabase.auth.signInWithPassword({ email, password })
    const { error } = await action
    setLoading(false)
    if (error) {
      setError(error.message)
      return
    }
    onClose()
  }



  const btnSecondary = {
    padding: '10px',
    borderRadius: '8px',
    background: '#333',
    color: 'white',
    border: '0',
    cursor: 'pointer' as const,
    flex: 1,
  }

  return (
    <Modal onClose={onClose}>
      <h3 style={{ marginTop: 0 }}>{mode === 'signup' ? 'Sign up' : 'Log in'}</h3>

      <div style={{ display: 'grid', gap: 8 }}>
        <input
          style={{ 
            padding: 10, 
            borderRadius: 8, 
            border: '1px solid #333', 
            background: '#1a1a1a', 
            color: 'white' 
          }}
          type="email"
          placeholder="Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          disabled={loading}
        />
        <input
          style={{ 
            padding: 10, 
            borderRadius: 8, 
            border: '1px solid #333', 
            background: '#1a1a1a', 
            color: 'white' 
          }}
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={loading}
        />

        {error && <div style={{ color: '#ff6b6b', fontSize: 12 }}>{error}</div>}

        <button
          style={{ 
            padding: 10, 
            borderRadius: 8, 
            background: '#6e56cf', 
            color: 'white', 
            border: 0, 
            cursor: 'pointer' 
          }}
          onClick={submit}
          disabled={loading || !email || !password}
        >
          {loading ? 'Please wait...' : mode === 'signup' ? 'Create account' : 'Log in'}
        </button>



        <button
          style={{ 
            padding: '8px 0', 
            background: 'transparent', 
            color: '#888', 
            border: 0, 
            cursor: 'pointer' 
          }}
          onClick={() => setMode(mode === 'signup' ? 'login' : 'signup')}
          disabled={loading}
        >
          {mode === 'signup' ? 'Already have an account? Log in' : "Don't have an account? Sign up"}
        </button>
      </div>
    </Modal>
  )
}