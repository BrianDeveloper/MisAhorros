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
