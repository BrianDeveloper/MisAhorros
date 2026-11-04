import { ThemeProvider } from '@/context/ThemeContext'
import { AuthProvider } from '@/context/AuthContext'
import { UserDisplayProvider } from '@/context/UserDisplayContext'

export function AppProvider({ children }: { children: React.ReactNode }) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <UserDisplayProvider>{children}</UserDisplayProvider>
      </AuthProvider>
    </ThemeProvider>
  )
}
