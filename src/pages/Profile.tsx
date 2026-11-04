import { useState } from 'react'
import type { FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { Layout } from '@/components/layout/Layout'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { useWallet } from '@/hooks/useTransactions'
import { formatCurrency } from '@/utils/currency'
import { supabase } from '@/lib/supabaseClient'
import { useUserDisplay } from '@/context/UserDisplayContext'
import type { AvatarIcon } from '@/context/UserDisplayContext'
import { Cat, Coffee, Fingerprint, Heart, ImagePlus, PiggyBank, Smile, Star, Trash2, UserRound } from 'lucide-react'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { SettingSwitch } from '@/components/ui/SettingSwitch'

const avatarOptions: Array<{ value: AvatarIcon; label: string; Icon: typeof UserRound }> = [
  { value: 'UserRound', label: 'Persona', Icon: UserRound },
  { value: 'Smile', label: 'Sonrisa', Icon: Smile },
  { value: 'Star', label: 'Estrella', Icon: Star },
  { value: 'Heart', label: 'Corazón', Icon: Heart },
  { value: 'PiggyBank', label: 'Alcancía', Icon: PiggyBank },
  { value: 'Cat', label: 'Gato', Icon: Cat },
  { value: 'Coffee', label: 'Café', Icon: Coffee },
]

async function prepareAvatar(file: File): Promise<string> {
  if (!file.type.startsWith('image/')) throw new Error('Selecciona un archivo de imagen.')
  if (file.size > 5 * 1024 * 1024) throw new Error('La imagen debe pesar menos de 5 MB.')
  const image = await createImageBitmap(file)
  try {
    const canvas = document.createElement('canvas')
    canvas.width = 256
    canvas.height = 256
    const context = canvas.getContext('2d')
    if (!context) throw new Error('No se pudo procesar la imagen.')
    const size = Math.min(image.width, image.height)
    const x = (image.width - size) / 2
    const y = (image.height - size) / 2
    context.drawImage(image, x, y, size, size, 0, 0, 256, 256)
    return canvas.toDataURL('image/jpeg', 0.82)
  } finally {
    image.close()
  }
}

export default function Profile() {
  const {
    user, signOut, isNative, rememberedAccount, enableBiometrics, disableBiometrics,
  } = useAuth()
  const {
    theme, setTheme, themes, hideBalances, setHideBalances,
    largeText, setLargeText, reduceMotion, setReduceMotion,
  } = useTheme()
  const { profile, loading, error: profileError, fetchProfile } = useWallet()
  const {
    name: displayName,
    setName: setDisplayName,
    avatarIcon,
    setAvatarIcon,
    avatarImage,
    setAvatarImage,
  } = useUserDisplay()
  const navigate = useNavigate()
  const [currencyError, setCurrencyError] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [passwordConfirmation, setPasswordConfirmation] = useState('')
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null)
  const [passwordError, setPasswordError] = useState<string | null>(null)
  const [signOutError, setSignOutError] = useState<string | null>(null)
  const [savingPassword, setSavingPassword] = useState(false)
  const [avatarError, setAvatarError] = useState<string | null>(null)
  const [biometricError, setBiometricError] = useState<string | null>(null)
  const [biometricMessage, setBiometricMessage] = useState<string | null>(null)
  const [savingBiometrics, setSavingBiometrics] = useState(false)

  const handleAvatarChange = async (file: File | undefined) => {
    if (!file) return
    setAvatarError(null)
    try {
      setAvatarImage(await prepareAvatar(file))
    } catch (error) {
      setAvatarError(error instanceof Error ? error.message : 'No se pudo procesar la imagen.')
    }
  }

  const handleCurrencyChange = async (currency: 'USD' | 'VES') => {
    setCurrencyError(null)
    const { error } = await supabase.rpc('update_profile_preferences', {
      p_currency_preference: currency,
    })
    if (error) {
      setCurrencyError(error.message)
      return
    }
    await fetchProfile()
  }

  const handlePasswordChange = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setPasswordError(null)
    setPasswordMessage(null)
    if (password.length < 8) {
      setPasswordError('La contraseña debe tener al menos 8 caracteres.')
      return
    }
    if (password !== passwordConfirmation) {
      setPasswordError('Las contraseñas no coinciden.')
      return
    }

    setSavingPassword(true)
    const { error } = await supabase.auth.updateUser({ password })
    if (error) {
      setPasswordError(error.message)
    } else {
      setPassword('')
      setPasswordConfirmation('')
      setPasswordMessage('Contraseña actualizada.')
    }
    setSavingPassword(false)
  }

  const handleSignOut = async () => {
    const { error } = await signOut()
    if (error) {
      setSignOutError(error.message)
      return
    }
    navigate('/login', { replace: true })
  }

  const handleBiometricSetting = async () => {
    setBiometricError(null)
    setBiometricMessage(null)
    setSavingBiometrics(true)
    const result = rememberedAccount
      ? await disableBiometrics()
      : await enableBiometrics()
    if (result.error) {
      setBiometricError(result.error.message)
    } else {
      setBiometricMessage(rememberedAccount
        ? 'Se desactivó el acceso biométrico.'
        : 'Acceso biométrico activado para esta cuenta.')
    }
    setSavingBiometrics(false)
  }

  const currency = profile?.currency_preference ?? 'USD'

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-lg font-bold">Perfil y ajustes</h1>
          <button
            type="button"
            onClick={() => void handleSignOut()}
            className="shrink-0 rounded-3xl px-4 py-2.5 text-sm font-bold"
            style={{ background: '#b91c1c', color: '#ffffff' }}
          >
            Cerrar sesión
          </button>
        </div>

        <section className="card-cream flex flex-col gap-2 p-4" aria-label="Información de la cuenta">
          <p className="text-sm break-all">{user?.email || 'Correo no disponible'}</p>
          <p className="text-sm opacity-80">Saldo actual: {hideBalances ? '******' : formatCurrency(profile?.balance_actual ?? 0, currency)}</p>
          {signOutError && <p role="alert" className="text-sm text-red-600">{signOutError}</p>}
          {profileError && <p role="alert" className="text-sm text-red-600">{profileError}</p>}
          {!loading && !profile && !profileError && (
            <p role="alert" className="text-sm text-red-600">No se encontró el perfil de finanzas para esta cuenta.</p>
          )}
        </section>

        <CollapsibleSection title="Saludo y avatar" className="card-cream p-5" contentClassName="mt-4 flex flex-col gap-3">
          <p className="text-xs opacity-75">Personaliza el saludo que aparece al abrir la app. Estos datos se guardan en este dispositivo.</p>
          <label htmlFor="display-name" className="text-sm">Nombre para mostrar</label>
          <input
            id="display-name"
            value={displayName}
            maxLength={40}
            onChange={(event) => setDisplayName(event.target.value)}
            placeholder={user?.email?.split('@')[0] || 'Tu nombre'}
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <label htmlFor="avatar-icon" className="text-sm">Icono de perfil</label>
          <select
            id="avatar-icon"
            value={avatarIcon}
            onChange={(event) => {
              const selectedIcon = avatarOptions.find((option) => option.value === event.target.value)
              if (selectedIcon) {
                setAvatarIcon(selectedIcon.value)
                setAvatarImage(null)
              }
            }}
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            {avatarOptions.map(({ value, label }) => <option key={value} value={value}>{label}</option>)}
          </select>
          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center gap-2 rounded-3xl px-4 py-2 text-sm font-semibold" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              <ImagePlus size={16} />
              Elegir foto
              <input
                type="file"
                accept="image/*"
                className="sr-only"
                onChange={(event) => {
                  void handleAvatarChange(event.target.files?.[0])
                  event.target.value = ''
                }}
              />
            </label>
            {avatarImage && (
              <button type="button" onClick={() => setAvatarImage(null)} className="inline-flex items-center gap-2 rounded-3xl px-4 py-2 text-sm" style={{ background: 'var(--color-surface)', color: 'var(--color-text)' }}>
                <Trash2 size={16} /> Quitar foto
              </button>
            )}
          </div>
          {avatarError && <p role="alert" className="text-sm text-red-600">{avatarError}</p>}
        </CollapsibleSection>

        <CollapsibleSection title="Preferencias" className="card-cream p-5" contentClassName="mt-4 flex flex-col gap-3">
          <label htmlFor="currency" className="text-sm">Moneda para mostrar importes</label>
          <select
            id="currency"
            value={currency}
            disabled={!profile || loading}
            onChange={(event) => {
              const selectedCurrency = event.target.value
              if (selectedCurrency === 'USD' || selectedCurrency === 'VES') {
                void handleCurrencyChange(selectedCurrency)
              }
            }}
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            <option value="USD">USD — dólar estadounidense</option>
            <option value="VES">VES — bolívar venezolano</option>
          </select>
          {currencyError && <p role="alert" className="text-sm text-red-600">{currencyError}</p>}
          <p className="text-xs opacity-70">Cambiar la moneda solo cambia el formato; no convierte los saldos existentes.</p>

          <label htmlFor="theme" className="text-sm mt-2">Tema</label>
          <select
            id="theme"
            value={theme}
            onChange={(event) => {
              const selectedTheme = themes.find((option) => option.value === event.target.value)
              if (selectedTheme) setTheme(selectedTheme.value)
            }}
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          >
            {themes.map((option) => (
              <option key={option.value} value={option.value}>{option.emoji} {option.label}</option>
            ))}
          </select>
          <p className="text-xs opacity-70">El tema se guarda en este dispositivo.</p>

          <div className="mt-2 flex flex-col gap-4">
            <SettingSwitch
              id="hide-balances"
              label="Ocultar importes"
              description="Solo oculta los valores en pantalla; no cifra tus datos."
              checked={hideBalances}
              onChange={setHideBalances}
            />
            <SettingSwitch
              id="large-text"
              label="Texto más grande"
              checked={largeText}
              onChange={setLargeText}
            />
            <SettingSwitch
              id="reduce-motion"
              label="Reducir animaciones"
              description="También puedes usar la preferencia del dispositivo."
              checked={reduceMotion}
              onChange={setReduceMotion}
            />
          </div>
        </CollapsibleSection>

        <CollapsibleSection title="Acceso rápido" className="card-cream p-5" contentClassName="mt-4 flex flex-col gap-3">
          {isNative ? (
            <>
              <p className="text-xs opacity-75">
                {rememberedAccount
                  ? `Biometría activada para ${rememberedAccount.email}. La sesión se guarda de forma segura en este dispositivo.`
                  : 'Usa la huella o el reconocimiento facial para desbloquear la sesión guardada en este dispositivo. No se guarda tu contraseña.'}
              </p>
              <button
                type="button"
                disabled={savingBiometrics}
                onClick={() => void handleBiometricSetting()}
                className="flex items-center justify-center gap-2 rounded-3xl py-2.5 font-semibold"
                style={{
                  background: rememberedAccount ? 'var(--color-accent)' : 'var(--color-primary)',
                  color: rememberedAccount ? 'var(--color-text)' : 'var(--color-primary-foreground)',
                }}
              >
                <Fingerprint size={18} />
                {savingBiometrics
                  ? 'Procesando...'
                  : rememberedAccount ? 'Desactivar biometría' : 'Activar biometría'}
              </button>
              {biometricError && <p role="alert" className="text-sm text-red-600">{biometricError}</p>}
              {biometricMessage && <p role="status" className="text-sm">{biometricMessage}</p>}
            </>
          ) : (
            <p className="text-xs opacity-75">El acceso biométrico está disponible en la aplicación móvil, no en el navegador.</p>
          )}
        </CollapsibleSection>

        <CollapsibleSection title="Cambiar contraseña" className="card-cream p-5" contentClassName="mt-4 flex flex-col gap-3">
          <form onSubmit={handlePasswordChange} className="flex flex-col gap-3">
            <label className="text-sm flex flex-col gap-2">
              Nueva contraseña
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                className="rounded-3xl px-4 py-2"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </label>
            <label className="text-sm flex flex-col gap-2">
              Confirmar contraseña
              <input
                type="password"
                autoComplete="new-password"
                minLength={8}
                required
                value={passwordConfirmation}
                onChange={(event) => setPasswordConfirmation(event.target.value)}
                className="rounded-3xl px-4 py-2"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </label>
            {passwordError && <p role="alert" className="text-sm text-red-600">{passwordError}</p>}
            {passwordMessage && <p role="status" className="text-sm">{passwordMessage}</p>}
            <button
              disabled={savingPassword}
              className="rounded-3xl py-2.5 font-semibold"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              {savingPassword ? 'Actualizando...' : 'Actualizar contraseña'}
            </button>
          </form>
        </CollapsibleSection>
      </div>
    </Layout>
  )
}
