import { createContext, useContext, useEffect, useState } from 'react'

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
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  useEffect(() => {
    document.documentElement.dataset.textSize = largeText ? 'large' : 'normal'
    localStorage.setItem(LARGE_TEXT_KEY, String(largeText))
  }, [largeText])

  useEffect(() => {
    document.documentElement.dataset.reduceMotion = String(reduceMotion)
    localStorage.setItem(REDUCE_MOTION_KEY, String(reduceMotion))
  }, [reduceMotion])

  const setTheme = (newTheme: CreamyTheme) => {
    setThemeState(newTheme)
  }

  const setHideBalances = (hide: boolean) => {
    setHideBalancesState(hide)
    localStorage.setItem(HIDE_BALANCES_KEY, String(hide))
  }

  const setLargeText = (large: boolean) => setLargeTextState(large)
  const setReduceMotion = (reduce: boolean) => setReduceMotionState(reduce)

  return (
    <ThemeContext.Provider
      value={{ theme, setTheme, themes, hideBalances, setHideBalances, largeText, setLargeText, reduceMotion, setReduceMotion }}
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
