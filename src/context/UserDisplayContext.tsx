import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { useAuth } from '@/context/AuthContext'

export type AvatarIcon = 'UserRound' | 'Smile' | 'Star' | 'Heart' | 'PiggyBank' | 'Cat' | 'Coffee'

interface UserDisplayPreferences {
  name: string
  avatarIcon: AvatarIcon
  avatarImage: string | null
}

interface UserDisplayContextValue extends UserDisplayPreferences {
  setName: (name: string) => void
  setAvatarIcon: (icon: AvatarIcon) => void
  setAvatarImage: (image: string | null) => void
}

const UserDisplayContext = createContext<UserDisplayContextValue | undefined>(undefined)

const defaultPreferences: UserDisplayPreferences = {
  name: '',
  avatarIcon: 'UserRound',
  avatarImage: null,
}

function storageKey(userId: string) {
  return `misahorros:user-display:${userId}`
}

function readPreferences(userId: string | undefined): UserDisplayPreferences {
  if (!userId || typeof window === 'undefined') return defaultPreferences
  try {
    const stored = localStorage.getItem(storageKey(userId))
    if (!stored) return defaultPreferences
    const preferences = JSON.parse(stored) as Partial<UserDisplayPreferences>
    const validIcons: AvatarIcon[] = ['UserRound', 'Smile', 'Star', 'Heart', 'PiggyBank', 'Cat', 'Coffee']
    return {
      name: typeof preferences.name === 'string' ? preferences.name : '',
      avatarIcon: validIcons.includes(preferences.avatarIcon as AvatarIcon)
        ? preferences.avatarIcon as AvatarIcon
        : 'UserRound',
      avatarImage: typeof preferences.avatarImage === 'string' ? preferences.avatarImage : null,
    }
  } catch {
    return defaultPreferences
  }
}

export function UserDisplayProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <UserDisplayState key={user?.id ?? 'anonymous'} userId={user?.id} >{children}</UserDisplayState>
}

function UserDisplayState({ children, userId }: { children: React.ReactNode; userId: string | undefined }) {
  const [preferences, setPreferences] = useState<UserDisplayPreferences>(() => readPreferences(userId))
  const save = useCallback((next: UserDisplayPreferences) => {
    if (userId && typeof window !== 'undefined') {
      localStorage.setItem(storageKey(userId), JSON.stringify(next))
    }
    setPreferences(next)
  }, [userId])
  const value = useMemo<UserDisplayContextValue>(() => ({
    ...preferences,
    setName: (name) => save({ ...preferences, name }),
    setAvatarIcon: (avatarIcon) => save({ ...preferences, avatarIcon }),
    setAvatarImage: (avatarImage) => save({ ...preferences, avatarImage }),
  }), [preferences, save])

  return <UserDisplayContext.Provider value={value}>{children}</UserDisplayContext.Provider>
}

export function useUserDisplay() {
  const context = useContext(UserDisplayContext)
  if (!context) throw new Error('useUserDisplay must be used within UserDisplayProvider')
  return context
}
