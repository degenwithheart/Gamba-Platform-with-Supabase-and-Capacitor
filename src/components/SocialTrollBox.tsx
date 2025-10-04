import React, { useState, useRef, useEffect } from 'react'
import styled, { css, keyframes } from 'styled-components'
import { useAuth } from '../hooks/useAuth'
import { useProfile } from '../hooks/useProfile'
import { useChat } from '../hooks/useChat'
import { useSocialFeatures } from '../hooks/useSocialFeatures'
import { ENABLE_SUPABASE_AUTH, ENABLE_TROLLBOX } from '../constants'
import type { ChatMessage, DirectMessage, SocialUser } from '../types/social'

type Tab = 'chat' | 'dms' | 'friends'

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(5px) }
  to   { opacity: 1; transform: translateY(0) }
`

const Wrapper = styled.div<{ $isMinimized: boolean }>`
  position: fixed;
  bottom: 20px;
  right: 20px;
  z-index: 998;
  border-radius: ${({ $isMinimized }) => ($isMinimized ? '50%' : '12px')};
  background: ${({ $isMinimized }) => ($isMinimized ? '#5e47ff' : 'rgba(28,28,35,0.95)')};
  border: 1px solid rgba(255,255,255,0.1);
  color: #eee;
  font-size: 0.9rem;
  box-shadow: 0 8px 20px rgba(0,0,0,0.3);
  backdrop-filter: blur(10px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  cursor: ${({ $isMinimized }) => ($isMinimized ? 'pointer' : 'default')};
  transition: all 0.3s ease;

  ${({ $isMinimized }) =>
    $isMinimized
      ? css`
          width: 56px;
          height: 56px;
          justify-content: center;
          align-items: center;
          color: #fff;
        `
      : css`
          width: 380px;
          max-height: 500px;
          min-height: 200px;
        `}

  @media (max-width: 480px) {
    ${({ $isMinimized }) =>
      $isMinimized
        ? css`
            bottom: 16px;
            right: 16px;
          `
        : css`
            width: calc(100% - 32px);
            max-width: 350px;
            max-height: 300px;
            bottom: 16px;
            right: 16px;
          `}
  }
`

const ExpandIcon = styled.div`
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  height: 100%;
  cursor: pointer;
`

const ContentContainer = styled.div<{ $isMinimized: boolean }>`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  min-height: 0;
  opacity: ${({ $isMinimized }) => ($isMinimized ? 0 : 1)};
  transition: opacity 0.2s;
  pointer-events: ${({ $isMinimized }) => ($isMinimized ? 'none' : 'auto')};
`

const Header = styled.div`
  padding: 12px 16px;
  border-bottom: 1px solid rgba(255,255,255,0.08);
  display: flex;
  align-items: center;
  justify-content: space-between;
  flex-shrink: 0;
`

const Title = styled.div`
  font-weight: 600;
  font-size: 1rem;
`

const TabContainer = styled.div`
  display: flex;
  background: rgba(0,0,0,0.2);
  border-radius: 6px;
  overflow: hidden;
  margin-left: 12px;
`

const Tab = styled.button<{ $active: boolean }>`
  background: ${({ $active }) => ($active ? '#5e47ff' : 'transparent')};
  color: ${({ $active }) => ($active ? '#fff' : '#ccc')};
  border: none;
  padding: 4px 8px;
  font-size: 0.75rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s;
  
  &:hover {
    background: ${({ $active }) => ($active ? '#5e47ff' : 'rgba(255,255,255,0.1)')};
  }
`

const MinimizeButton = styled.button`
  background: transparent;
  border: none;
  color: #888;
  cursor: pointer;
  padding: 4px;
  border-radius: 4px;
  
  &:hover {
    background: rgba(255,255,255,0.1);
    color: #fff;
  }
`

const ContentArea = styled.div`
  flex: 1;
  display: flex;
  flex-direction: column;
  min-height: 0;
`

const MessageArea = styled.div`
  flex: 1;
  padding: 8px 16px;
  overflow-y: auto;
  font-size: 0.85rem;
  min-height: 120px;

  &::-webkit-scrollbar {
    width: 4px;
  }

  &::-webkit-scrollbar-thumb {
    background: rgba(255,255,255,0.2);
    border-radius: 2px;
  }
`

const MessageItem = styled.div`
  line-height: 1.4;
  margin-bottom: 8px;
  animation: ${fadeIn} 0.3s ease-out;
`

const Username = styled.strong<{ userColor: string }>`
  font-weight: 600;
  color: ${({ userColor }) => userColor};
  margin-right: 0.4em;
  cursor: pointer;
  
  &:hover {
    text-decoration: underline;
  }
`

const MessageText = styled.span`
  word-wrap: break-word;
`

const Timestamp = styled.span`
  font-size: 0.7rem;
  color: #888;
  opacity: 0.7;
  margin-left: 0.4em;
`

const InputArea = styled.div`
  border-top: 1px solid rgba(255,255,255,0.08);
  background: rgba(0,0,0,0.1);
  flex-shrink: 0;
`

const InputRow = styled.div`
  display: flex;
  align-items: center;
  padding: 8px 12px;
  gap: 8px;
`

const TextInput = styled.input`
  flex: 1;
  background: rgba(255,255,255,0.05);
  border: 1px solid rgba(255,255,255,0.1);
  border-radius: 6px;
  padding: 8px 12px;
  color: #eee;
  outline: none;
  font-size: 0.9rem;

  &::placeholder {
    color: #777;
  }
  
  &:focus {
    border-color: #5e47ff;
  }
`

const SendButton = styled.button`
  background: #5e47ff;
  color: white;
  border: none;
  border-radius: 6px;
  padding: 8px 12px;
  cursor: pointer;
  font-size: 0.8rem;
  font-weight: 500;
  
  &:hover {
    background: #7c6aff;
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
`

const EmptyState = styled.div`
  text-align: center;
  color: #888;
  font-size: 0.8rem;
  padding: 20px;
`

const UserList = styled.div`
  display: flex;
  flex-direction: column;
  gap: 8px;
`

const UserItem = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 8px 12px;
  background: rgba(255,255,255,0.05);
  border-radius: 6px;
  border: 1px solid rgba(255,255,255,0.1);
`

const UserInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  flex: 1;
`

const Avatar = styled.div<{ color: string }>`
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: ${({ color }) => color};
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.7rem;
  font-weight: bold;
  color: white;
`

const UserActions = styled.div`
  display: flex;
  gap: 4px;
`

const ActionButton = styled.button`
  background: rgba(255,255,255,0.1);
  color: #ccc;
  border: none;
  border-radius: 4px;
  padding: 4px 8px;
  cursor: pointer;
  font-size: 0.7rem;
  
  &:hover {
    background: rgba(255,255,255,0.2);
  }
`

// Helper function for user color
const stringToHslColor = (str: string, s: number, l: number): string => {
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    hash = str.charCodeAt(i) + ((hash << 5) - hash)
  }
  return `hsl(${hash % 360}, ${s}%, ${l}%)`
}

export function SocialTrollBox() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  const { messages, sendMessage, loading: chatLoading } = useChat()
  const { searchUsers, followUser, sendFriendRequest } = useSocialFeatures()
  
  const [isMinimized, setIsMinimized] = useState(false)
  const [activeTab, setActiveTab] = useState<Tab>('chat')
  const [inputMessage, setInputMessage] = useState('')
  const [searchQuery, setSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SocialUser[]>([])
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Don't show if neither feature is enabled
  if (!ENABLE_TROLLBOX && !ENABLE_SUPABASE_AUTH) return null

  // Auto scroll to bottom for new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const handleSendMessage = async () => {
    if (!inputMessage.trim() || !user) return

    const success = await sendMessage(inputMessage)
    if (success) {
      setInputMessage('')
      inputRef.current?.focus()
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSendMessage()
    }
  }

  const handleUserSearch = async (query: string) => {
    setSearchQuery(query)
    if (query.trim().length > 2) {
      const results = await searchUsers(query)
      setSearchResults(results)
    } else {
      setSearchResults([])
    }
  }

  const handleFollow = async (userId: string) => {
    await followUser(userId)
    // Refresh search results
    if (searchQuery) {
      const results = await searchUsers(searchQuery)
      setSearchResults(results)
    }
  }

  const handleFriendRequest = async (userId: string) => {
    await sendFriendRequest(userId)
    // Refresh search results
    if (searchQuery) {
      const results = await searchUsers(searchQuery)
      setSearchResults(results)
    }
  }

  if (isMinimized) {
    return (
      <Wrapper $isMinimized={true} onClick={() => setIsMinimized(false)}>
        <ExpandIcon>
          💬
        </ExpandIcon>
      </Wrapper>
    )
  }

  return (
    <Wrapper $isMinimized={false}>
      <ContentContainer $isMinimized={false}>
        <Header>
          <Title>Social Hub</Title>
          {ENABLE_SUPABASE_AUTH && (
            <TabContainer>
              <Tab 
                $active={activeTab === 'chat'} 
                onClick={() => setActiveTab('chat')}
              >
                Chat
              </Tab>
              <Tab 
                $active={activeTab === 'dms'} 
                onClick={() => setActiveTab('dms')}
              >
                DMs
              </Tab>
              <Tab 
                $active={activeTab === 'friends'} 
                onClick={() => setActiveTab('friends')}
              >
                Friends
              </Tab>
            </TabContainer>
          )}
          <MinimizeButton onClick={() => setIsMinimized(true)}>
            ✕
          </MinimizeButton>
        </Header>

        <ContentArea>
          {activeTab === 'chat' && (
            <>
              <MessageArea>
                {messages.length === 0 ? (
                  <EmptyState>
                    {ENABLE_SUPABASE_AUTH 
                      ? "No messages yet. Start the conversation!" 
                      : "Connect your account to join the chat!"}
                  </EmptyState>
                ) : (
                  messages.map((message) => (
                    <MessageItem key={message.id}>
                      <Username 
                        userColor={stringToHslColor(message.user?.username || 'anon', 60, 60)}
                      >
                        {message.user?.username || 'Anonymous'}
                      </Username>
                      <MessageText>{message.message}</MessageText>
                      <Timestamp>
                        {new Date(message.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit'
                        })}
                      </Timestamp>
                    </MessageItem>
                  ))
                )}
                <div ref={messagesEndRef} />
              </MessageArea>
              
              {ENABLE_SUPABASE_AUTH && user && (
                <InputArea>
                  <InputRow>
                    <TextInput
                      ref={inputRef}
                      value={inputMessage}
                      onChange={(e) => setInputMessage(e.target.value)}
                      onKeyPress={handleKeyPress}
                      placeholder={profile?.username ? "Type a message..." : "Create a profile to chat"}
                      disabled={!profile}
                      maxLength={500}
                    />
                    <SendButton 
                      onClick={handleSendMessage}
                      disabled={!inputMessage.trim() || !profile || chatLoading}
                    >
                      Send
                    </SendButton>
                  </InputRow>
                </InputArea>
              )}
            </>
          )}

          {activeTab === 'friends' && ENABLE_SUPABASE_AUTH && (
            <>
              <MessageArea>
                <InputRow>
                  <TextInput
                    value={searchQuery}
                    onChange={(e) => handleUserSearch(e.target.value)}
                    placeholder="Search users..."
                  />
                </InputRow>
                
                <UserList>
                  {searchResults.map((socialUser) => (
                    <UserItem key={socialUser.id}>
                      <UserInfo>
                        <Avatar color={stringToHslColor(socialUser.username || 'anon', 60, 50)}>
                          {(socialUser.username || 'A')[0].toUpperCase()}
                        </Avatar>
                        <div>
                          <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>
                            {socialUser.username || 'Anonymous'}
                          </div>
                          {socialUser.bio && (
                            <div style={{ fontSize: '0.75rem', color: '#888' }}>
                              {socialUser.bio.slice(0, 50)}...
                            </div>
                          )}
                        </div>
                      </UserInfo>
                      
                      <UserActions>
                        {socialUser.relationship_status === 'none' && (
                          <>
                            <ActionButton onClick={() => handleFollow(socialUser.id)}>
                              Follow
                            </ActionButton>
                            <ActionButton onClick={() => handleFriendRequest(socialUser.id)}>
                              Friend
                            </ActionButton>
                          </>
                        )}
                        {socialUser.relationship_status === 'following' && (
                          <ActionButton>Following</ActionButton>
                        )}
                        {socialUser.relationship_status === 'friend' && (
                          <ActionButton>Friends</ActionButton>
                        )}
                        {socialUser.relationship_status === 'pending' && (
                          <ActionButton>Pending</ActionButton>
                        )}
                      </UserActions>
                    </UserItem>
                  ))}
                </UserList>
                
                {searchQuery && searchResults.length === 0 && (
                  <EmptyState>
                    No users found matching "{searchQuery}"
                  </EmptyState>
                )}
              </MessageArea>
            </>
          )}

          {activeTab === 'dms' && ENABLE_SUPABASE_AUTH && (
            <MessageArea>
              <EmptyState>
                Direct messages coming soon!
                <br />
                <small>Select users from Friends to start conversations</small>
              </EmptyState>
            </MessageArea>
          )}
        </ContentArea>
      </ContentContainer>
    </Wrapper>
  )
}