import React from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { ProfileDisplay } from './ProfileDisplay'
import { GambaUi } from 'gamba-react-ui-v2'

export function ExampleProfileEntry() {
  const { user } = useAuth()
  const { profile, loading } = useProfile(user?.id)

  if (loading) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading profile...</div>
      </div>
    )
  }

  if (!user || !profile) {
    return (
      <div style={{ 
        padding: '20px', 
        textAlign: 'center',
        background: 'rgba(255,255,255,0.05)',
        borderRadius: '12px',
        border: '1px solid #333'
      }}>
        <h3 style={{ margin: '0 0 10px', color: '#fff' }}>
          Profile System Example
        </h3>
        <p style={{ color: '#ccc', fontSize: '14px', margin: '0 0 15px' }}>
          Sign in to create your profile and track your gaming stats!
        </p>
        <GambaUi.Button>
          Sign In to Continue
        </GambaUi.Button>
      </div>
    )
  }

  return (
    <div style={{
      background: 'rgba(255,255,255,0.05)',
      borderRadius: '12px',
      border: '1px solid #333',
      overflow: 'hidden'
    }}>
      <div style={{ padding: '15px 20px', borderBottom: '1px solid #333' }}>
        <h3 style={{ margin: 0, color: '#fff', fontSize: '16px' }}>
          Your Profile
        </h3>
      </div>
      
      <ProfileDisplay profile={profile} />
    </div>
  )
}