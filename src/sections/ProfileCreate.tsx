import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { GambaUi } from 'gamba-react-ui-v2'

export function ProfileCreate() {
  const { user } = useAuth()
  const { upsert, loading } = useProfile(user?.id)
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!username.trim()) return

    setError(null)
    const { error } = await upsert({
      username: username.trim(),
      bio: bio.trim() || null,
      avatar_url: null,
    })

    if (error) {
      setError(error.message)
    }
  }

  return (
    <div style={{ padding: '20px', maxWidth: '400px', margin: '0 auto' }}>
      <h2>Create Your Profile</h2>
      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
            Username *
          </label>
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            placeholder="Enter your username"
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#1a1a1a',
              color: 'white'
            }}
            disabled={loading}
            required
          />
        </div>

        <div>
          <label style={{ display: 'block', marginBottom: '5px', color: '#fff' }}>
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            placeholder="Tell us about yourself (optional)"
            rows={3}
            style={{
              width: '100%',
              padding: '10px',
              borderRadius: '8px',
              border: '1px solid #333',
              background: '#1a1a1a',
              color: 'white',
              resize: 'vertical'
            }}
            disabled={loading}
          />
        </div>

        {error && (
          <div style={{ color: '#ff6b6b', fontSize: '14px' }}>
            {error}
          </div>
        )}

        <GambaUi.Button
          type="submit"
          disabled={loading || !username.trim()}
          main
        >
          {loading ? 'Creating...' : 'Create Profile'}
        </GambaUi.Button>
      </form>
    </div>
  )
}