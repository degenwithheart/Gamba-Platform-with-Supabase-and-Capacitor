import { useWallet } from '@solana/wallet-adapter-react'
import { useWalletModal } from '@solana/wallet-adapter-react-ui'
import { GambaUi, useReferral } from 'gamba-react-ui-v2'
import React, { useState } from 'react'
import { Modal } from '../components/Modal'
import { PLATFORM_ALLOW_REFERRER_REMOVAL, PLATFORM_REFERRAL_FEE } from '../constants'
import { useToast } from '../hooks/useToast'
import { useUserStore } from '../hooks/useUserStore'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useWalletAuth } from '../hooks/useWalletAuth'
import { supabase } from '../lib/supabaseClient'
import { AuthModal } from '../components/AuthModal'
import { WalletAuthModal } from '../components/WalletAuthModal'
import { ProfileFlow } from './ProfileFlow'
import { ENABLE_SUPABASE_AUTH } from '../constants'
import { truncateString } from '../utils'

function UserModal() {
  const user = useUserStore()
  const wallet = useWallet()
  const toast = useToast()
  const walletModal = useWalletModal()
  const referral = useReferral()
  const { user: supabaseUser } = useAuth()
  const { profile } = useProfile(supabaseUser?.id)
  const { canPlay, isWalletAuthRequired } = useWalletAuth()
  const [removing, setRemoving] = useState(false)
  const [showProfile, setShowProfile] = useState(false)
  const [showAuthModal, setShowAuthModal] = useState(false)

  const copyInvite = () => {
    try {
      referral.copyLinkToClipboard()
      toast({
        title: '📋 Copied to clipboard',
        description: 'Your referral code has been copied!',
      })
    } catch {
      walletModal.setVisible(true)
    }
  }

  const removeInvite = async () => {
    try {
      setRemoving(true)
      await referral.removeInvite()
    } finally {
      setRemoving(false)
    }
  }

  const handleSupabaseSignOut = async () => {
    await supabase.auth.signOut()
    toast({
      title: '👋 Signed out',
      description: 'You have been signed out of your account.',
    })
  }

  if (showProfile) {
    return (
      <Modal onClose={() => user.set({ userModal: false })}>
        <ProfileFlow />
        <div style={{ marginTop: '20px', textAlign: 'center' }}>
          <GambaUi.Button onClick={() => setShowProfile(false)}>
            Back to Wallet
          </GambaUi.Button>
        </div>
      </Modal>
    )
  }

  return (
    <Modal onClose={() => user.set({ userModal: false })}>
      <h1>
        {truncateString(wallet.publicKey?.toString() ?? '', 6, 3)}
      </h1>
      <div style={{ display: 'flex', gap: '20px', flexDirection: 'column', width: '100%', padding: '0 20px' }}>
        {/* Only show invite link if user has a Supabase account */}
        {supabaseUser && (
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
            <GambaUi.Button main onClick={copyInvite}>
              💸 Copy invite link
            </GambaUi.Button>
            <div style={{ opacity: '.8', fontSize: '80%' }}>
              Share your link with new users to earn {(PLATFORM_REFERRAL_FEE * 100)}% every time they play on this platform.
            </div>
          </div>
        )}
        {PLATFORM_ALLOW_REFERRER_REMOVAL && referral.referrerAddress && (
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%' }}>
            <GambaUi.Button disabled={removing} onClick={removeInvite}>
              Remove invite
            </GambaUi.Button>
            <div style={{ opacity: '.8', fontSize: '80%' }}>
              {!removing ? (
                <>
                  You were invited by <a target="_blank" href={`https://solscan.io/account/${referral.referrerAddress.toString()}`} rel="noreferrer">
                    {truncateString(referral.referrerAddress.toString(), 6, 6)}
                  </a>.
                </>
              ) : (
                <>Removing invite...</>
              )}
            </div>
          </div>
        )}
        
        {/* Supabase Profile Section - Only show if feature is enabled */}
        {ENABLE_SUPABASE_AUTH && (
          <div style={{ display: 'flex', gap: '10px', flexDirection: 'column', width: '100%', borderTop: '1px solid #333', paddingTop: '20px' }}>
            {/* Wallet Auth Status */}
            {isWalletAuthRequired && (
              <div style={{ 
                padding: '10px', 
                background: 'rgba(255, 193, 7, 0.1)', 
                borderRadius: '8px',
                border: '1px solid rgba(255, 193, 7, 0.3)',
                marginBottom: '10px'
              }}>
                <div style={{ fontSize: '12px', color: '#ffc107', fontWeight: 'bold' }}>
                  ⚠️ Account Required
                </div>
                <div style={{ fontSize: '11px', color: '#ccc', marginTop: '2px' }}>
                  Wallet must be linked to an account
                </div>
              </div>
            )}
            
            {supabaseUser ? (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
                  <div style={{ fontSize: '14px', color: '#fff' }}>
                    {profile?.username || 'Anonymous User'}
                  </div>
                  {profile && (
                    <div style={{ fontSize: '12px', color: '#888' }}>
                      (Verified)
                    </div>
                  )}
                  {canPlay && (
                    <div style={{ fontSize: '10px', color: '#4CAF50', background: 'rgba(76, 175, 80, 0.1)', padding: '2px 6px', borderRadius: '4px' }}>
                      ✓ Linked
                    </div>
                  )}
                </div>
                
                <GambaUi.Button onClick={() => setShowProfile(true)}>
                  🏆 View Profile
                </GambaUi.Button>
                
                <GambaUi.Button onClick={handleSupabaseSignOut}>
                  Sign Out Account
                </GambaUi.Button>
              </>
            ) : (
              <>
                <div style={{ opacity: '.8', fontSize: '80%', marginBottom: '10px' }}>
                  {isWalletAuthRequired 
                    ? 'Your wallet requires an account to play on this platform.'
                    : 'Create an account to track stats and customize your profile.'
                  }
                </div>
                <GambaUi.Button onClick={() => setShowAuthModal(true)}>
                  🔐 Sign In / Sign Up
                </GambaUi.Button>
              </>
            )}
          </div>
        )}

        <GambaUi.Button onClick={() => wallet.disconnect()}>
          Disconnect Wallet
        </GambaUi.Button>
      </div>
    </Modal>
  )
}

export function UserButton() {
  const walletModal = useWalletModal()
  const wallet = useWallet()
  const user = useUserStore()
  const { isWalletAuthRequired } = useWalletAuth()
  const [showAuthModal, setShowAuthModal] = useState(false)
  const [showWalletAuthModal, setShowWalletAuthModal] = useState(false)

  const connect = () => {
    if (wallet.wallet) {
      wallet.connect()
    } else {
      walletModal.setVisible(true)
    }
  }

  // Show wallet auth modal when wallet requires account
  React.useEffect(() => {
    if (isWalletAuthRequired && !showWalletAuthModal) {
      setShowWalletAuthModal(true)
    }
  }, [isWalletAuthRequired])

  return (
    <>
      {wallet.connected && user.userModal && (
        <UserModal />
      )}
      
      <AuthModal 
        open={showAuthModal} 
        onClose={() => setShowAuthModal(false)} 
      />
      
      <WalletAuthModal 
        open={showWalletAuthModal}
        onClose={() => setShowWalletAuthModal(false)}
        onSuccess={() => setShowWalletAuthModal(false)}
      />
      
      {wallet.connected ? (
        <div style={{ position: 'relative' }}>
          <GambaUi.Button
            onClick={() => user.set({ userModal: true })}
          >
            <div style={{ display: 'flex', gap: '.5em', alignItems: 'center' }}>
              <img src={wallet.wallet?.adapter.icon} height="20px" />
              {truncateString(wallet.publicKey?.toBase58(), 3)}
            </div>
          </GambaUi.Button>
        </div>
      ) : (
        <GambaUi.Button onClick={connect}>
          {wallet.connecting ? 'Connecting' : 'Connect'}
        </GambaUi.Button>
      )}
    </>
  )
}
