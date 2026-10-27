import { useState } from 'react'
import { useAuth } from '@/context/AuthContext'
import { useNavigate } from 'react-router-dom'

export default function Login() {
  const { signIn, signUp } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

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
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4" style={{ background: 'radial-gradient(1400px 900px at 50% 0%, var(--color-bg) 0%, #FFFFFF 100%)' }}>
      <div className="w-full max-w-sm card-cream p-6 flex flex-col gap-4">
        <div className="text-center">
          <h1 className="text-xl font-bold">MisAhorros</h1>
          <p className="text-sm opacity-80">{isSignUp ? 'Crear cuenta' : 'Iniciar sesión'}</p>
        </div>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="Correo"
            required
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Contraseña"
            required
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
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
