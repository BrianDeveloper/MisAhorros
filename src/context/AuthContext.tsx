import { createContext, useCallback, useContext, useEffect, useState } from 'react'
import type { Session, User } from '@supabase/supabase-js'
import { App } from '@capacitor/app'
import type { PluginListenerHandle } from '@capacitor/core'
import { BiometricAuth } from '@aparajita/capacitor-biometric-auth'
import { supabase } from '@/lib/supabaseClient'
import {
  clearRememberedBiometricAccount,
  getRememberedBiometricAccount,
  isNativeBiometricPlatform,
  saveRememberedBiometricAccount,
} from '@/lib/authStorage'
import type { RememberedBiometricAccount } from '@/lib/authStorage'

interface AuthResult {
  error: Error | null
}

interface AuthContextType {
  session: Session | null
  user: User | null
  loading: boolean
  locked: boolean
  authError: string | null
  rememberedAccount: RememberedBiometricAccount | null
  isNative: boolean
  signIn: (email: string, password: string) => Promise<AuthResult>
  signUp: (email: string, password: string) => Promise<AuthResult>
  signOut: () => Promise<AuthResult>
  enableBiometrics: () => Promise<AuthResult>
  disableBiometrics: () => Promise<AuthResult>
  unlockWithBiometrics: () => Promise<AuthResult>
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

function toError(error: unknown): Error {
  return error instanceof Error ? error : new Error('Ocurrió un error inesperado.')
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)
  const [locked, setLocked] = useState(false)
  const [authError, setAuthError] = useState<string | null>(null)
  const [rememberedAccount, setRememberedAccount] = useState<RememberedBiometricAccount | null>(null)

  useEffect(() => {
    let mounted = true
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      setUser(nextSession?.user ?? null)
      if (event === 'SIGNED_OUT') setLocked(false)
    })

    void (async () => {
      try {
        const { data, error } = await supabase.auth.getSession()
        if (error) throw error
        if (!mounted) return

        const nextUser = data.session?.user ?? null
        let remembered: RememberedBiometricAccount | null
        try {
          remembered = await getRememberedBiometricAccount()
        } catch (storageError) {
          if (!mounted) return
          setSession(data.session)
          setUser(nextUser)
          setLocked(Boolean(isNativeBiometricPlatform && nextUser))
          setAuthError(toError(storageError).message)
          return
        }
        if (!mounted) return

        setSession(data.session)
        setUser(nextUser)
        setRememberedAccount(remembered)
        setLocked(Boolean(isNativeBiometricPlatform && nextUser && remembered))
      } catch (error) {
        if (mounted) setAuthError(toError(error).message)
      } finally {
        if (mounted) setLoading(false)
      }
    })()

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!isNativeBiometricPlatform || loading || !user || !rememberedAccount) return

    let active = true
    let listener: PluginListenerHandle | undefined
    void App.addListener('appStateChange', ({ isActive }) => {
      if (!isActive) setLocked(true)
    }).then((handle) => {
      listener = handle
      if (!active) {
        void handle.remove().catch((error: unknown) => {
          if (active) setAuthError(toError(error).message)
        })
      }
    }).catch((error: unknown) => {
      if (active) {
        setLocked(true)
        setAuthError(`No se pudo activar el bloqueo al salir de la app: ${toError(error).message}`)
      }
    })

    return () => {
      active = false
      if (listener) {
        void listener.remove().catch((error: unknown) => {
          setAuthError(`No se pudo liberar el listener de la app: ${toError(error).message}`)
        })
      }
    }
  }, [loading, rememberedAccount, user])

  const signIn = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    const { data, error } = await supabase.auth.signInWithPassword({ email, password })
    if (error) return { error: new Error(error.message) }

    setLocked(false)
    setAuthError(null)
    if (rememberedAccount && (
      rememberedAccount.email.toLowerCase() !== email.trim().toLowerCase()
      || rememberedAccount.userId !== data.user?.id
    )) {
      try {
        await clearRememberedBiometricAccount()
        setRememberedAccount(null)
      } catch (storageError) {
        return { error: toError(storageError) }
      }
    }
    return { error: null }
  }, [rememberedAccount])

  const signUp = useCallback(async (email: string, password: string): Promise<AuthResult> => {
    if (rememberedAccount) {
      try {
        await clearRememberedBiometricAccount()
        setRememberedAccount(null)
      } catch (error) {
        return { error: toError(error) }
      }
    }
    const { error } = await supabase.auth.signUp({ email, password })
    if (error) return { error: new Error(error.message) }
    setLocked(false)
    setAuthError(null)
    return { error: null }
  }, [rememberedAccount])

  const signOut = useCallback(async (): Promise<AuthResult> => {
    const { error } = await supabase.auth.signOut()
    if (error) return { error: new Error(error.message) }
    try {
      await clearRememberedBiometricAccount()
      setRememberedAccount(null)
      setLocked(false)
      return { error: null }
    } catch (storageError) {
      return { error: toError(storageError) }
    }
  }, [])

  const enableBiometrics = useCallback(async (): Promise<AuthResult> => {
    if (!isNativeBiometricPlatform) {
      return { error: new Error('El acceso biométrico solo está disponible en la aplicación móvil.') }
    }
    if (!user?.email) return { error: new Error('No se encontró el correo de esta cuenta.') }

    try {
      const availability = await BiometricAuth.checkBiometry()
      if (!availability.isAvailable) {
        return { error: new Error(availability.reason || 'Configura una huella o reconocimiento facial en el dispositivo.') }
      }
      await BiometricAuth.authenticate({
        reason: 'Confirma tu identidad para activar el acceso rápido a MisAhorros.',
        cancelTitle: 'Cancelar',
        allowDeviceCredential: false,
        androidTitle: 'Acceso a MisAhorros',
      })
      const account = { email: user.email, userId: user.id }
      await saveRememberedBiometricAccount(account)
      setRememberedAccount(account)
      setLocked(false)
      return { error: null }
    } catch (error) {
      return { error: toError(error) }
    }
  }, [user])

  const disableBiometrics = useCallback(async (): Promise<AuthResult> => {
    try {
      await clearRememberedBiometricAccount()
      setRememberedAccount(null)
      setLocked(false)
      return { error: null }
    } catch (error) {
      return { error: toError(error) }
    }
  }, [])

  const unlockWithBiometrics = useCallback(async (): Promise<AuthResult> => {
    if (!isNativeBiometricPlatform || !rememberedAccount) {
      return { error: new Error('No hay una cuenta biométrica disponible en este dispositivo.') }
    }
    if (!user || user.id !== rememberedAccount.userId) {
      return { error: new Error('La sesión no está disponible. Inicia sesión con tu contraseña para continuar.') }
    }
    try {
      await BiometricAuth.authenticate({
        reason: 'Desbloquea MisAhorros para continuar.',
        cancelTitle: 'Usar contraseña',
        allowDeviceCredential: false,
        androidTitle: 'Desbloquear MisAhorros',
      })
      setLocked(false)
      return { error: null }
    } catch (error) {
      return { error: toError(error) }
    }
  }, [rememberedAccount, user])

  return (
    <AuthContext.Provider value={{
      session,
      user,
      loading,
      locked,
      authError,
      rememberedAccount,
      isNative: isNativeBiometricPlatform,
      signIn,
      signUp,
      signOut,
      enableBiometrics,
      disableBiometrics,
      unlockWithBiometrics,
    }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
