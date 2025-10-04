# Supabase Integration Complete

This integration adds a complete authentication and profile system to your Gamba platform using Supabase with a **feature flag system** for easy enable/disable.

## 🎯 What's Been Added

### 1. **Feature Flag System**
- **`ENABLE_SUPABASE_AUTH`** constant in `src/constants.ts`
- **When TRUE**: Wallet connection requires Supabase account (login/signup)
- **When FALSE**: Standard Gamba wallet-only functionality
- All Supabase features respect this flag

### 2. **Wallet-Linked Authentication**
- Wallet connection triggers account requirement when flag is enabled
- Automatic login if wallet is already linked to an account
- Force signup flow if wallet has no linked account
- Seamless integration between wallet and auth systems

### 3. **Authentication System**
- Email/password authentication
- OAuth providers (GitHub, Google, Discord)
- Session management with wallet linking
- User state persistence

### 4. **Profile System** 
- User profiles with username, bio, and avatar
- Profile creation and editing
- Public profile display
- Profile verification badges

### 5. **Game Access Control**
- Games are protected when `ENABLE_SUPABASE_AUTH` is true
- Users must have linked accounts to play
- Clear messaging for auth requirements
- Graceful fallback when flag is disabled

### 6. **Database Schema**
- `profiles` table with Row Level Security (RLS)
- Automatic timestamp updates
- Proper foreign key relationships

### 7. **UI Components**
- `AuthModal` - Standard sign in/sign up modal
- `WalletAuthModal` - Wallet-specific auth flow
- `ProfileFlow` - Complete profile management
- `GameAccessControl` - Game protection wrapper
- Enhanced `UserButton` with dual auth support

### 8. **React Hooks**
- `useAuth()` - Authentication state management
- `useProfile()` - Profile data management
- `useWalletAuth()` - Wallet-auth integration logic

## 📁 Files Added/Modified

### New Files:
```
src/
├── lib/
│   └── supabaseClient.ts         # Supabase client configuration
├── hooks/
│   ├── useAuth.ts               # Authentication hook
│   ├── useProfile.ts            # Profile management hook
│   └── useWalletAuth.ts         # Wallet-auth integration logic
├── types/
│   └── profile.ts               # TypeScript profile types
├── components/
│   ├── AuthModal.tsx            # Standard authentication modal
│   ├── WalletAuthModal.tsx      # Wallet-specific auth flow
│   └── GameAccessControl.tsx    # Game protection wrapper
├── sections/
│   ├── ProfileFlow.tsx          # Main profile component
│   ├── ProfileCreate.tsx        # Profile creation form
│   ├── ProfileDisplay.tsx       # Profile viewer
│   └── ExampleProfileEntry.tsx  # Demo component
├── vite-env.d.ts               # Environment type definitions
└── supabase/
    └── profiles.sql             # Database schema
```

### Modified Files:
- `src/constants.ts` - **Added ENABLE_SUPABASE_AUTH flag**
- `src/App.tsx` - Added conditional profile route
- `src/sections/Header.tsx` - Added conditional profile button
- `src/sections/UserButton.tsx` - Enhanced with wallet-auth integration
- `src/sections/Game/Game.tsx` - Added game access control
- `src/sections/Dashboard/FeaturedInlineGame.tsx` - Added game protection
- `src/components/index.tsx` - Export new components

## 🚀 How to Use

### 1. **Enable/Disable Feature**
```typescript
// In src/constants.ts
export const ENABLE_SUPABASE_AUTH = true  // or false
```

### 2. **Database Setup** (if enabling)
Run the SQL in `supabase/profiles.sql` in your Supabase SQL editor to create the profiles table and policies.

### 3. **Environment Variables** (already configured)
```env
VITE_SUPABASE_URL=https://ayetpsnbaaemanddcobe.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
```

### 4. **User Experience**
- **Flag ON**: Wallet connection → Account required → Profile creation → Game access
- **Flag OFF**: Wallet connection → Immediate game access (standard Gamba)

### 5. **Profile Management** (when enabled)
- Access via `/profile` route or profile button in header
- Wallet-linked account creation
- Profile customization and verification

### 6. **Integration Points**

#### In UserButton Modal:
```tsx
// Shows profile info and sign-in options
{supabaseUser ? (
  <ProfileSection />
) : (
  <SignInPrompt />
)}
```

#### In Header:
```tsx
// Profile button appears when user has profile
{profile && (
  <NavLink to="/profile">
    <GambaUi.Button>
      🏆 {profile.username}
    </GambaUi.Button>
  </NavLink>
)}
```

#### Anywhere in your app:
```tsx
import { useAuth, useProfile } from '../hooks/...'

function MyComponent() {
  const { user } = useAuth()
  const { profile } = useProfile(user?.id)
  
  return (
    <div>
      {profile ? (
        <span>Welcome, {profile.username}!</span>
      ) : (
        <span>Welcome, Guest!</span>
      )}
    </div>
  )
}
```

## ⚙️ Feature Flag Control

### In `src/constants.ts`:
```typescript
// Set to true to enable Supabase auth requirements
// Set to false for standard Gamba functionality
export const ENABLE_SUPABASE_AUTH = true
```

### When `ENABLE_SUPABASE_AUTH = true`:
- 🔒 **Wallet connection requires account**
- 📝 Users must sign up/login when connecting wallet
- 🎮 Games are protected until account is linked
- 🏆 Profile features available
- 📊 Enhanced user tracking possible

### When `ENABLE_SUPABASE_AUTH = false`:
- 🔓 **Standard Gamba behavior**
- 🎮 Immediate game access with wallet connection
- 🚫 No profile features
- ⚡ Faster onboarding for casual users

## 🔧 Features

### Smart Wallet Authentication
- **When Flag Enabled**: Wallet connection triggers auth flow
- **Existing Account**: Automatic login if wallet is linked
- **New User**: Required signup with wallet linking
- **Account Linking**: Wallets permanently linked to accounts

### Profile Features
- Username (unique, required)
- Bio (optional)
- Avatar URL (optional, future feature)
- Creation/update timestamps
- Public visibility with privacy controls
- Wallet address linking

### Game Access Control
- **Protected Games**: When auth flag is enabled
- **Clear Messaging**: Why account is required
- **Seamless Flow**: Easy signup from game pages
- **Fallback Support**: Graceful disable when flag is off

### Security
- Row Level Security (RLS) policies
- Users can only edit their own profiles
- Wallet-account linking verification
- Secure session management with wallet integration

## 🎮 User Experience Flows

### When `ENABLE_SUPABASE_AUTH = true`:

1. **New User Flow**: 
   - Connects wallet → Account required modal
   - Signs up with email/OAuth → Wallet automatically linked
   - Creates profile → Can play games

2. **Returning User Flow**:
   - Connects wallet → Automatic login (if linked)
   - Profile restored → Immediate game access
   - Enhanced features available

3. **Game Access**:
   - Protected by account requirement
   - Clear explanation of benefits
   - One-click auth from game pages

### When `ENABLE_SUPABASE_AUTH = false`:

1. **Standard Gamba Flow**:
   - Connect wallet → Play immediately
   - No account requirements
   - No profile features
   - Traditional casino experience

## 🔄 Next Steps

The integration is complete and ready to use! Consider adding:

- **Stats Tracking**: Store game statistics in profiles
- **Leaderboards**: Enhance existing leaderboard with profile data  
- **Social Features**: Friend systems, comments, etc.
- **Avatar Upload**: File storage for custom avatars
- **Achievements**: Badge/trophy system

## 🛠 Development Notes

- TypeScript support included
- Works with Vite edge runtime
- Respects existing Gamba architecture
- No breaking changes to existing functionality
- Modular design - can be extended or removed easily

The Supabase integration is now fully wired into your platform! Users can create accounts, manage profiles, and enjoy an enhanced gaming experience while maintaining all existing wallet-based functionality.