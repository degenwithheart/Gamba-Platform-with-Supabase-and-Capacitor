import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { AuthModal } from '../components/AuthModal'
import { ProfileCreate } from './ProfileCreate'
import { ProfileDisplay } from './ProfileDisplay'
import { GambaUi } from 'gamba-react-ui-v2'

export function ProfileFlow() {
  const { user, loading: authLoading } = useAuth()
  const { profile, loading: profileLoading } = useProfile(user?.id)
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [editMode, setEditMode] = useState(false)

  if (authLoading || profileLoading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading...</div>
      </div>
    )
  }

  // Not authenticated - show sign in prompt
  if (!user) {
    return (
      <>
        <div style={{ 
          padding: '20px', 
          textAlign: 'center',
          maxWidth: '400px',
          margin: '0 auto'
        }}>
          <h2>Join the Community</h2>
          <p style={{ color: '#ccc', marginBottom: '20px' }}>
            Create an account to track your stats, customize your profile, and connect with other players.
          </p>
          <GambaUi.Button 
            main 
            onClick={() => setShowAuthModal(true)}
          >
            Sign In / Sign Up
          </GambaUi.Button>
        </div>
        
        <AuthModal 
          open={showAuthModal} 
          onClose={() => setShowAuthModal(false)} 
        />
      </>
    )
  }

  // Authenticated but no profile - show profile creation
  if (!profile) {
    return <ProfileCreate />
  }

  // Has profile - show profile display
  if (editMode) {
    return <ProfileCreate />
  }

  return (
    <ProfileDisplay 
      profile={profile} 
      onEdit={() => setEditMode(true)} 
    />
  )
}