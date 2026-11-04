import { Capacitor } from '@capacitor/core'
import { SecureStorage } from '@aparajita/capacitor-secure-storage'

const isNative = Capacitor.isNativePlatform()
const storageReady = isNative
  ? SecureStorage.setKeyPrefix('misahorros-auth-')
  : Promise.resolve()

export const supabaseAuthStorage = {
  getItem: async (key: string): Promise<string | null> => {
    if (!isNative) return localStorage.getItem(key)
    await storageReady
    return SecureStorage.getItem(`supabase:${key}`)
  },
  setItem: async (key: string, value: string): Promise<void> => {
    if (!isNative) {
      localStorage.setItem(key, value)
      return
    }
    await storageReady
    await SecureStorage.setItem(`supabase:${key}`, value)
  },
  removeItem: async (key: string): Promise<void> => {
    if (!isNative) {
      localStorage.removeItem(key)
      return
    }
    await storageReady
    await SecureStorage.removeItem(`supabase:${key}`)
  },
}

export interface RememberedBiometricAccount {
  email: string
  userId: string
}

const accountKey = 'biometric-account'

export async function getDevicePreference(key: string): Promise<string | null> {
  if (!isNative) return localStorage.getItem(key)
  await storageReady
  const value = await SecureStorage.getItem(`preference:${key}`)
  if (value !== null) return value

  const legacyValue = localStorage.getItem(key)
  if (legacyValue !== null) await SecureStorage.setItem(`preference:${key}`, legacyValue)
  return legacyValue
}

export async function saveDevicePreference(key: string, value: string): Promise<void> {
  if (!isNative) {
    localStorage.setItem(key, value)
    return
  }
  await storageReady
  await SecureStorage.setItem(`preference:${key}`, value)
}

export async function hasPersistedAuthSession(): Promise<boolean> {
  if (!isNative) return false
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
  if (!supabaseUrl) throw new Error('Falta configurar la URL de Supabase.')
  const projectRef = new URL(supabaseUrl).hostname.split('.')[0]
  const stored = await supabaseAuthStorage.getItem(`sb-${projectRef}-auth-token`)
  if (!stored) return false

  const session: unknown = JSON.parse(stored)
  return (
    typeof session === 'object'
    && session !== null
    && 'access_token' in session
    && typeof session.access_token === 'string'
    && 'refresh_token' in session
    && typeof session.refresh_token === 'string'
  )
}

export async function getRememberedBiometricAccount(): Promise<RememberedBiometricAccount | null> {
  if (!isNative) return null
  await storageReady
  const value = await SecureStorage.getItem(accountKey)
  if (!value) return null

  try {
    const account: unknown = JSON.parse(value)
    if (
      typeof account === 'object'
      && account !== null
      && 'email' in account
      && typeof account.email === 'string'
      && 'userId' in account
      && typeof account.userId === 'string'
    ) {
      return { email: account.email, userId: account.userId }
    }
    throw new Error('El perfil biométrico guardado no es válido.')
  } catch (error) {
    if (error instanceof SyntaxError) {
      throw new Error(`No se pudo leer el perfil biométrico guardado: ${error.message}`)
    }
    throw error
  }
}

export async function saveRememberedBiometricAccount(account: RememberedBiometricAccount): Promise<void> {
  if (!isNative) throw new Error('El acceso biométrico solo está disponible en la aplicación móvil.')
  await storageReady
  await SecureStorage.setItem(accountKey, JSON.stringify(account))
}

export async function clearRememberedBiometricAccount(): Promise<void> {
  if (!isNative) return
  await storageReady
  await SecureStorage.removeItem(accountKey)
}

export { isNative as isNativeBiometricPlatform }
