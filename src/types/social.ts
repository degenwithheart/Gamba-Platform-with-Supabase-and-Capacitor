export type UserRelationship = {
  id: string
  follower_id: string
  following_id: string
  relationship_type: 'follow' | 'friend'
  status: 'pending' | 'accepted' | 'blocked'
  created_at: string
  updated_at: string
}

export type ChatMessage = {
  id: string
  user_id: string
  message: string
  channel: string
  reply_to?: string
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    id: string
    username: string
    avatar_url?: string
  }
}

export type DirectMessage = {
  id: string
  sender_id: string
  recipient_id: string
  message: string
  read_at?: string
  created_at: string
  // Joined data
  sender?: {
    id: string
    username: string
    avatar_url?: string
  }
  recipient?: {
    id: string
    username: string
    avatar_url?: string
  }
}

export type UserStats = {
  id: string
  user_id: string
  game_id: string
  total_wagered: number
  total_winnings: number
  games_played: number
  biggest_win: number
  biggest_loss: number
  last_played_at: string
  created_at: string
  updated_at: string
  // Joined data
  user?: {
    id: string
    username: string
    avatar_url?: string
  }
}

export type SocialUser = {
  id: string
  username: string
  avatar_url?: string
  bio?: string
  // Social stats
  followers_count?: number
  following_count?: number
  relationship_status?: 'none' | 'following' | 'friend' | 'pending' | 'blocked'
}