import React, { useState } from 'react'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { ENABLE_SUPABASE_AUTH } from '../constants'
import { GambaUi } from 'gamba-react-ui-v2'
import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { WalletAuthModal } from './WalletAuthModal'

type Props = {
  children: React.ReactNode
}

export function GameAccessControl({ children }: Props) {
  const { canPlay, isWalletAuthRequired } = useWalletAuth()
  const { connected } = useWallet()
  const walletModal = useWalletModal()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showLearnMore, setShowLearnMore] = useState(false)

  // If Supabase auth is disabled, always allow playing
  if (!ENABLE_SUPABASE_AUTH) {
    return <>{children}</>
  }

  const handleConnectSignUp = () => {
    console.log('Connect & Sign Up clicked. Connected:', connected)
    if (!connected) {
      // First connect wallet
      console.log('Opening wallet modal')
      walletModal.setVisible(true)
    } else {
      // Already connected, show auth modal for account linking
      console.log('Opening auth modal')
      setShowAuthModal(true)
    }
  }

  const handleLearnMore = () => {
    console.log('Learn More clicked. Setting showLearnMore to true')
    setShowLearnMore(true)
  }

  // If wallet auth is required, show message
  if (isWalletAuthRequired || !canPlay) {
    return (
      <div style={{
        padding: '40px 20px',
        textAlign: 'center',
        background: 'rgba(255, 193, 7, 0.1)',
        borderRadius: '12px',
        border: '1px solid rgba(255, 193, 7, 0.3)',
        margin: '20px 0'
      }}>
        <div style={{ fontSize: '48px', marginBottom: '20px' }}>🔒</div>
        <h2 style={{ color: '#ffc107', margin: '0 0 15px' }}>
          Account Required
        </h2>
        <p style={{ color: '#ccc', fontSize: '16px', margin: '0 0 25px', maxWidth: '400px', marginLeft: 'auto', marginRight: 'auto' }}>
          To play games on this platform, you need to connect your wallet and link it to an account. 
          This ensures enhanced security and enables profile features.
        </p>
        <div style={{ display: 'flex', gap: '10px', justifyContent: 'center', flexWrap: 'wrap' }}>
          <GambaUi.Button onClick={handleConnectSignUp}>
            {connected ? '🔗 Link Account' : '🔐 Connect & Sign Up'}
          </GambaUi.Button>
          <GambaUi.Button onClick={handleLearnMore}>
            📚 Learn More
          </GambaUi.Button>
        </div>
        
        <div style={{ 
          marginTop: '20px', 
          padding: '15px', 
          background: 'rgba(0,0,0,0.3)', 
          borderRadius: '8px',
          fontSize: '14px',
          color: '#888'
        }}>
          <strong>Why do I need an account?</strong>
          <br />
          Account linking provides enhanced security, enables stat tracking, 
          and allows you to customize your gaming profile.
        </div>
        
        {/* Auth Modal for wallet linking */}
        <WalletAuthModal 
          open={showAuthModal}
          onClose={() => setShowAuthModal(false)}
          onSuccess={() => setShowAuthModal(false)}
        />
        
        {/* Learn More Modal */}
        {showLearnMore && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowLearnMore(false)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', color: '#ffc107' }}>📚 About Account Linking</h2>
            
            <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>🔐 Enhanced Security</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Linking your wallet to an account provides an additional layer of security and ensures only you can access your gaming profile.
              </p>
              
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>📊 Statistics Tracking</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Your game statistics, winnings, and achievements are tracked and displayed on leaderboards. Build your reputation in the community!
              </p>
              
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>🎮 Social Features</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Connect with other players, chat in real-time, send direct messages, and follow your favorite gamers.
              </p>
              
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>🏆 Leaderboards</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Compete on various leaderboards including total wagered, biggest wins, and games played. See how you rank against other players!
              </p>
            </div>
            
            <div style={{ 
              padding: '15px', 
              background: 'rgba(94, 71, 255, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(94, 71, 255, 0.3)',
              marginBottom: '20px'
            }}>
              <strong style={{ color: '#5e47ff' }}>Your Privacy Matters</strong>
              <p style={{ color: '#ccc', fontSize: '14px', margin: '5px 0 0' }}>
                We only store essential information needed for game functionality. Your wallet address is securely linked to your profile.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <GambaUi.Button onClick={() => setShowLearnMore(false)}>
                Close
              </GambaUi.Button>
              <GambaUi.Button onClick={() => {
                setShowLearnMore(false)
                handleConnectSignUp()
              }}>
                Get Started
              </GambaUi.Button>
            </div>
          </div>
        </div>
        )}
      </div>
    )
  }

  // User can play, render the children
  return (
    <>
      {children}
      
      {/* Auth Modal for wallet linking */}
      <WalletAuthModal 
        open={showAuthModal}
        onClose={() => setShowAuthModal(false)}
        onSuccess={() => setShowAuthModal(false)}
      />
      
      {/* Learn More Modal */}
      {showLearnMore && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0, 0, 0, 0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 1000,
          padding: '20px'
        }} onClick={() => setShowLearnMore(false)}>
          <div style={{
            background: '#1a1a1a',
            borderRadius: '12px',
            padding: '30px',
            maxWidth: '500px',
            width: '100%',
            border: '1px solid rgba(255,255,255,0.1)',
            color: 'white'
          }} onClick={(e) => e.stopPropagation()}>
            <h2 style={{ margin: '0 0 20px', color: '#ffc107' }}>📚 About Account Linking</h2>
            
            <div style={{ marginBottom: '20px', lineHeight: '1.6' }}>
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>🔐 Enhanced Security</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Linking your wallet to an account provides an additional layer of security and ensures only you can access your gaming profile.
              </p>
              
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>📊 Statistics Tracking</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Your game statistics, winnings, and achievements are tracked and displayed on leaderboards. Build your reputation in the community!
              </p>
              
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>🎮 Social Features</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Connect with other players, chat in real-time, send direct messages, and follow your favorite gamers.
              </p>
              
              <h3 style={{ color: '#fff', marginBottom: '10px' }}>🏆 Leaderboards</h3>
              <p style={{ color: '#ccc', margin: '0 0 15px' }}>
                Compete on various leaderboards including total wagered, biggest wins, and games played. See how you rank against other players!
              </p>
            </div>
            
            <div style={{ 
              padding: '15px', 
              background: 'rgba(94, 71, 255, 0.1)', 
              borderRadius: '8px',
              border: '1px solid rgba(94, 71, 255, 0.3)',
              marginBottom: '20px'
            }}>
              <strong style={{ color: '#5e47ff' }}>Your Privacy Matters</strong>
              <p style={{ color: '#ccc', fontSize: '14px', margin: '5px 0 0' }}>
                We only store essential information needed for game functionality. Your wallet address is securely linked to your profile.
              </p>
            </div>
            
            <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
              <GambaUi.Button onClick={() => setShowLearnMore(false)}>
                Close
              </GambaUi.Button>
              <GambaUi.Button onClick={() => {
                setShowLearnMore(false)
                handleConnectSignUp()
              }}>
                Get Started
              </GambaUi.Button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}