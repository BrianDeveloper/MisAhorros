import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { getDevicePreference, saveDevicePreference } from '@/lib/authStorage'

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
  storageError: string | null
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

function parsePreferences(value: string): UserDisplayPreferences {
  const preferences = JSON.parse(value) as Partial<UserDisplayPreferences>
  const validIcons: AvatarIcon[] = ['UserRound', 'Smile', 'Star', 'Heart', 'PiggyBank', 'Cat', 'Coffee']
  return {
    name: typeof preferences.name === 'string' ? preferences.name : '',
    avatarIcon: validIcons.includes(preferences.avatarIcon as AvatarIcon)
      ? preferences.avatarIcon as AvatarIcon
      : 'UserRound',
    avatarImage: typeof preferences.avatarImage === 'string' ? preferences.avatarImage : null,
  }
}

export function UserDisplayProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return <UserDisplayState key={user?.id ?? 'anonymous'} userId={user?.id} >{children}</UserDisplayState>
}

function UserDisplayState({ children, userId }: { children: React.ReactNode; userId: string | undefined }) {
  const [preferences, setPreferences] = useState<UserDisplayPreferences>(defaultPreferences)
  const [storageError, setStorageError] = useState<string | null>(null)
  const userChangedPreferences = useRef(false)
  useEffect(() => {
    userChangedPreferences.current = false
    if (!userId) return
    let active = true
    void getDevicePreference(storageKey(userId)).then((stored) => {
      if (active && stored && !userChangedPreferences.current) {
        setPreferences(parsePreferences(stored))
      }
    }).catch((error: unknown) => {
      if (active) {
        setStorageError(error instanceof Error ? error.message : 'No se pudieron leer las preferencias del perfil.')
      }
    })
    return () => {
      active = false
    }
  }, [userId])

  const save = useCallback((next: UserDisplayPreferences) => {
    userChangedPreferences.current = true
    setPreferences(next)
    if (userId) {
      void saveDevicePreference(storageKey(userId), JSON.stringify(next)).then(() => {
        setStorageError(null)
      }).catch((error: unknown) => {
        setStorageError(error instanceof Error ? error.message : 'No se pudieron guardar las preferencias del perfil.')
      })
    }
  }, [userId])
  const value = useMemo<UserDisplayContextValue>(() => ({
    ...preferences,
    setName: (name) => save({ ...preferences, name }),
    setAvatarIcon: (avatarIcon) => save({ ...preferences, avatarIcon }),
    setAvatarImage: (avatarImage) => save({ ...preferences, avatarImage }),
    storageError,
  }), [preferences, save, storageError])

  return <UserDisplayContext.Provider value={value}>{children}</UserDisplayContext.Provider>
}

export function useUserDisplay() {
  const context = useContext(UserDisplayContext)
  if (!context) throw new Error('useUserDisplay must be used within UserDisplayProvider')
  return context
}
