import React from 'react'
import { useProfile } from '../hooks/useProfile'
import { GambaUi } from 'gamba-react-ui-v2'
import type { Profile } from '../types/profile'

type Props = {
  profile: Profile
  onEdit?: () => void
}

export function ProfileDisplay({ profile, onEdit }: Props) {
  const formatDate = (dateString: string | undefined) => {
    if (!dateString) return 'Unknown'
    return new Date(dateString).toLocaleDateString()
  }

  return (
    <div style={{ 
      padding: '20px', 
      maxWidth: '400px', 
      margin: '0 auto',
      textAlign: 'center' as const
    }}>
      <div style={{
        width: '80px',
        height: '80px',
        borderRadius: '50%',
        background: profile.avatar_url 
          ? `url(${profile.avatar_url})` 
          : 'linear-gradient(45deg, #6e56cf, #9c88ff)',
        backgroundSize: 'cover',
        backgroundPosition: 'center',
        margin: '0 auto 20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '30px',
        color: 'white'
      }}>
        {!profile.avatar_url && (profile.username?.[0]?.toUpperCase() || '?')}
      </div>

      <h2 style={{ margin: '0 0 10px', color: '#fff' }}>
        {profile.username || 'Anonymous User'}
      </h2>

      {profile.bio && (
        <p style={{ 
          color: '#ccc', 
          fontSize: '14px',
          lineHeight: '1.4',
          margin: '0 0 20px'
        }}>
          {profile.bio}
        </p>
      )}

      <div style={{ 
        fontSize: '12px', 
        color: '#888',
        marginBottom: '20px'
      }}>
        Member since {formatDate(profile.created_at)}
      </div>

      {onEdit && (
        <GambaUi.Button onClick={onEdit}>
          Edit Profile
        </GambaUi.Button>
      )}
    </div>
  )
}