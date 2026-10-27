import { createContext, useContext, useEffect, useState } from 'react'

export type CreamyTheme = 'vainilla-melocoton' | 'matcha-crema' | 'boba-milk-tea'

interface ThemeContextType {
  theme: CreamyTheme
  setTheme: (theme: CreamyTheme) => void
  themes: Array<{ value: CreamyTheme; label: string; emoji: string }>
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const STORAGE_KEY = 'misahorros:theme'

const themes: Array<{ value: CreamyTheme; label: string; emoji: string }> = [
  { value: 'vainilla-melocoton', label: 'Vainilla & Melocotón', emoji: '🍑' },
  { value: 'matcha-crema', label: 'Matcha & Crema', emoji: '🍵' },
  { value: 'boba-milk-tea', label: 'Boba Milk Tea', emoji: '🧋' },
]

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<CreamyTheme>(() => {
    if (typeof window === 'undefined') return 'vainilla-melocoton'
    const stored = localStorage.getItem(STORAGE_KEY) as CreamyTheme | null
    if (stored === 'vainilla-melocoton' || stored === 'matcha-crema' || stored === 'boba-milk-tea') {
      return stored
    }
    return 'vainilla-melocoton'
  })

  useEffect(() => {
    if (typeof document === 'undefined') return
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem(STORAGE_KEY, theme)
  }, [theme])

  const setTheme = (newTheme: CreamyTheme) => {
    setThemeState(newTheme)
  }

  return <ThemeContext.Provider value={{ theme, setTheme, themes }}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider')
  return ctx
}
