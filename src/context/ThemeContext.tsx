import { createContext, useContext, useEffect, useState } from 'react'
import { getDevicePreference, saveDevicePreference } from '@/lib/authStorage'

export type CreamyTheme = 'morado-pro' | 'morado-nocturno'

interface ThemeContextType {
  theme: CreamyTheme
  setTheme: (theme: CreamyTheme) => void
  themes: Array<{ value: CreamyTheme; label: string; emoji: string }>
  hideBalances: boolean
  setHideBalances: (hide: boolean) => void
  largeText: boolean
  setLargeText: (large: boolean) => void
  reduceMotion: boolean
  setReduceMotion: (reduce: boolean) => void
  storageError: string | null
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'misahorros:theme:v2'
const LEGACY_STORAGE_KEY = 'misahorros:theme'
const HIDE_BALANCES_KEY = 'misahorros:hide-balances'
const LARGE_TEXT_KEY = 'misahorros:large-text'
const REDUCE_MOTION_KEY = 'misahorros:reduce-motion'

const themes: Array<{ value: CreamyTheme; label: string; emoji: string }> = [
  { value: 'morado-pro', label: 'Light Purple', emoji: '💜' },
  { value: 'morado-nocturno', label: 'Dark Purple', emoji: '🌙' },
]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [hydrated, setHydrated] = useState(false)
  const [storageError, setStorageError] = useState<string | null>(null)
  const [theme, setThemeState] = useState<CreamyTheme>(() => {
    if (typeof window === 'undefined') return 'morado-pro'
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored === 'morado-pro' || stored === 'morado-nocturno') {
      return stored
    }
    const legacyStored = localStorage.getItem(LEGACY_STORAGE_KEY)
    if (legacyStored === 'morado-pro' || legacyStored === 'morado-nocturno') return legacyStored
    return 'morado-pro'
  })
  const [hideBalances, setHideBalancesState] = useState(() => {
    if (typeof window === 'undefined') return true
    return localStorage.getItem(HIDE_BALANCES_KEY) !== 'false'
  })
  const [largeText, setLargeTextState] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(LARGE_TEXT_KEY) === 'true'
  })
  const [reduceMotion, setReduceMotionState] = useState(() => {
    if (typeof window === 'undefined') return false
    return localStorage.getItem(REDUCE_MOTION_KEY) === 'true'
  })

  useEffect(() => {
    let active = true
    void Promise.all([
      getDevicePreference(STORAGE_KEY),
      getDevicePreference(HIDE_BALANCES_KEY),
      getDevicePreference(LARGE_TEXT_KEY),
      getDevicePreference(REDUCE_MOTION_KEY),
    ]).then(([savedTheme, savedHideBalances, savedLargeText, savedReduceMotion]) => {
      if (!active) return
      if (savedTheme === 'morado-pro' || savedTheme === 'morado-nocturno') setThemeState(savedTheme)
      if (savedHideBalances !== null) setHideBalancesState(savedHideBalances !== 'false')
      if (savedLargeText !== null) setLargeTextState(savedLargeText === 'true')
      if (savedReduceMotion !== null) setReduceMotionState(savedReduceMotion === 'true')
    }).catch((error: unknown) => {
      if (active) {
        setStorageError(error instanceof Error ? error.message : 'No se pudieron leer las preferencias guardadas.')
      }
    }).finally(() => {
      if (active) setHydrated(true)
    })
    return () => {
      active = false
    }
  }, [])

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.textSize = largeText ? 'large' : 'normal'
  }, [largeText])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion)
  }, [reduceMotion])

  useEffect(() => {
    if (!hydrated) return
    void Promise.all([
      saveDevicePreference(STORAGE_KEY, theme),
      saveDevicePreference(HIDE_BALANCES_KEY, String(hideBalances)),
      saveDevicePreference(LARGE_TEXT_KEY, String(largeText)),
      saveDevicePreference(REDUCE_MOTION_KEY, String(reduceMotion)),
    ]).then(() => setStorageError(null)).catch((error: unknown) => {
      setStorageError(error instanceof Error ? error.message : 'No se pudieron guardar las preferencias.')
    })
  }, [hydrated, hideBalances, largeText, reduceMotion, theme])

  const setTheme = (newTheme: CreamyTheme) => setThemeState(newTheme)
  const setHideBalances = (hide: boolean) => setHideBalancesState(hide)
  const setLargeText = (large: boolean) => setLargeTextState(large)
  const setReduceMotion = (reduce: boolean) => setReduceMotionState(reduce)

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, themes, hideBalances, setHideBalances, largeText, setLargeText, reduceMotion, setReduceMotion, storageError }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
