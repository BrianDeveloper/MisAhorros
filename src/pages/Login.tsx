import { useEffect, useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'
import { Fingerprint, UserRound } from 'lucide-react'

export default function Login() {
  const {
    signIn, signUp, user, locked, loading: authLoading, authError,
    rememberedAccount, isNative, unlockWithBiometrics,
  } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState(rememberedAccount?.email ?? '')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [biometricLoading, setBiometricLoading] = useState(false)

  useEffect(() => {
    if (user && !locked && !authLoading) navigate('/', { replace: true })
  }, [authLoading, locked, navigate, user])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)
    try {
      const { error } = isSignUp ? await signUp(email, password) : await signIn(email, password)
      if (error) {
        setError(error.message)
      } else {
        navigate('/')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'No se pudo completar el inicio de sesión.')
    } finally {
      setLoading(false)
    }
  }

  const handleBiometricUnlock = async () => {
    setError(null)
    setBiometricLoading(true)
    const result = await unlockWithBiometrics()
    if (result.error) setError(result.error.message)
    setBiometricLoading(false)
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(1400px 900px at 50% 0%, var(--color-bg) 0%, var(--color-bg) 100%)' }}>
      <div className="w-full max-w-sm card-cream p-6 flex flex-col gap-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">MisAhorros</h1>
          <p className="text-sm opacity-80">{locked ? 'Desbloquea tu cuenta' : isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</p>
        </div>
        {authLoading && <p className="text-center text-sm opacity-80">Comprobando sesión...</p>}
        {!authLoading && rememberedAccount && isNative && (
          <section className="flex flex-col items-center gap-3 rounded-3xl p-4 text-center" style={{ background: 'var(--color-surface)' }}>
            <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-full" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              <UserRound size={26} />
            </div>
            <div className="min-w-0 max-w-full">
              <p className="text-sm font-semibold">Cuenta recordada</p>
              <p className="break-all text-xs opacity-80">{rememberedAccount.email}</p>
            </div>
            {user?.id === rememberedAccount.userId && (
              <button
                type="button"
                disabled={biometricLoading}
                onClick={() => void handleBiometricUnlock()}
                className="flex w-full items-center justify-center gap-2 rounded-3xl py-2.5 font-semibold"
                style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
              >
                <Fingerprint size={19} />
                {biometricLoading ? 'Verificando...' : 'Desbloquear con biometría'}
              </button>
            )}
            {user?.id !== rememberedAccount.userId && (
              <p className="text-xs opacity-75">Inicia sesión con tu contraseña para recuperar el acceso a esta cuenta.</p>
            )}
          </section>
        )}
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email || rememberedAccount?.email || ''}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            autoComplete="email"
            required
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            autoComplete={isSignUp ? 'new-password' : 'current-password'}
            required
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          {authError && <p role="alert" className="text-xs text-red-500">{authError}</p>}
          {error && <p className="text-xs text-red-500">{error}</p>}
          <button disabled={loading} className="rounded-3xl py-2.5 font-semibold" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            {loading ? 'Procesando...' : isSignUp ? 'Registrarse' : 'Entrar'}
          </button>
        </form>
        <button onClick={() => setIsSignUp((v) => !v)} className="text-xs text-center opacity-80">
          {isSignUp ? '¿Ya tienes cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate'}
        </button>
      </div>
    </div>
  )
}
