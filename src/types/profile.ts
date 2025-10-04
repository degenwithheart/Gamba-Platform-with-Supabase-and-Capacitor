export type Profile = {
  id: string // auth.users.id (uuid)
  username: string | null
  avatar_url: string | null
  bio: string | null
  created_at?: string
  updated_at?: string
}