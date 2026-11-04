import { useState } from 'react'
import { Link, NavLink, useLocation } from 'react-router-dom'
import { useTheme } from '@/context/ThemeContext'
import { Palette, Home, ArrowLeftRight, Target, User, TrendingUp, Ellipsis, Smile, Star, Heart, PiggyBank, Cat, Coffee } from 'lucide-react'
import { BcvFloatingWidget } from '@/components/currency/BcvFloatingWidget'
import { useAuth } from '@/context/AuthContext'
import { useUserDisplay } from '@/context/UserDisplayContext'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { label: 'Inicio', icon: Home, href: '/' },
  { label: 'Movimientos', icon: ArrowLeftRight, href: '/movimientos' },
  { label: 'Metas', icon: Target, href: '/metas' },
  { label: 'Predicciones', icon: TrendingUp, href: '/predicciones' },
]

const avatarIcons = { UserRound: User, Smile, Star, Heart, PiggyBank, Cat, Coffee }

export function Layout({ children }: LayoutProps) {
  const { theme, setTheme, themes } = useTheme()
  const { user } = useAuth()
  const { name, avatarIcon, avatarImage } = useUserDisplay()
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const [moreOpen, setMoreOpen] = useState(false)
  const current = themes.find((t) => t.value === theme)
  const moreActive = pathname === '/categorias' || pathname.startsWith('/categorias/')
    || pathname === '/presupuestos' || pathname.startsWith('/presupuestos/')
    || pathname === '/perfil' || pathname.startsWith('/perfil/')
  const Avatar = avatarIcons[avatarIcon]
  const welcomeName = name.trim() || user?.email?.split('@')[0] || 'bienvenido'

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(1400px 900px at 50% 0%, var(--color-bg) 0%, var(--color-bg) 100%)' }}
    >
      <header className="sticky top-0 z-20 px-4 pt-4">
        <div className="card-cream flex items-center justify-between px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <div
              className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-full"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              {avatarImage
                ? <img src={avatarImage} alt="" className="h-full w-full object-cover" />
                : <Avatar size={19} />}
            </div>
            <div className="min-w-0">
              <p className="truncate text-sm font-semibold leading-tight">¡Hola, {welcomeName}!</p>
              <p className="line-clamp-1 text-xs opacity-80 leading-tight">Bienvenido a MisAhorros</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              type="button"
              aria-label={`Cambiar tema${current ? `, actual: ${current.label}` : ''}`}
              aria-expanded={open}
              title="Cambiar tema"
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full shadow-bubble"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <Palette size={16} />
            </button>
            {open && (
              <div className="absolute right-0 mt-2 w-72 card-cream p-2 flex flex-col gap-1">
                {themes.map((t) => (
                  <button
                    key={t.value}
                    onClick={() => {
                      setTheme(t.value)
                      setOpen(false)
                    }}
                    className={`flex items-center gap-2 rounded-3xl px-3 py-2 text-left text-sm ${
                      t.value === theme ? 'font-semibold' : ''
                    }`}
                    style={{
                      background: t.value === theme ? 'var(--color-primary)' : 'transparent',
                      color: t.value === theme ? 'var(--color-primary-foreground)' : 'var(--color-text)',
                    }}
                  >
                    <span>{t.emoji}</span>
                    <span>{t.label}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>
      </header>

      <main className="flex-1 px-4 py-4 pb-28">
        <div className="max-w-md mx-auto">{children}</div>
      </main>

      <nav aria-label="Navegación principal" className="bottom-nav fixed inset-x-0 bottom-0 z-30">
        <div className="mx-auto flex h-[4.25rem] max-w-md items-center justify-around px-1">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <NavLink
                key={item.href}
                to={item.href}
                end={item.href === '/'}
                aria-label={item.label}
                title={item.label}
                className="relative flex h-12 min-w-0 flex-1 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl px-0.5 text-[9px] leading-none"
              >
                {({ isActive }) => (
                  <>
                    {isActive && <span aria-hidden="true" className="absolute top-0.5 h-1 w-4 rounded-full" style={{ background: 'var(--color-primary)' }} />}
                    <Icon size={19} />
                    <span aria-hidden="true" className={`h-3 w-full truncate text-center ${isActive ? 'visible font-semibold' : 'invisible'}`}>{item.label}</span>
                  </>
                )}
              </NavLink>
            )
          })}
          <div className="relative flex min-w-0 flex-1 justify-center">
            <button type="button" aria-label="Más opciones" aria-expanded={moreOpen} aria-pressed={moreActive} onClick={() => setMoreOpen((value) => !value)} className={`relative flex h-12 w-full min-w-0 flex-col items-center justify-center gap-0.5 overflow-hidden rounded-2xl px-0.5 text-[9px] leading-none ${moreActive ? 'font-semibold' : ''}`} title="Más opciones">
              {moreActive && <span aria-hidden="true" className="absolute top-0.5 h-1 w-4 rounded-full" style={{ background: 'var(--color-primary)' }} />}
              <Ellipsis size={19} />
              <span aria-hidden="true" className={`h-3 w-full truncate text-center ${moreActive ? 'visible' : 'invisible'}`}>Más</span>
            </button>
            {moreOpen && (
              <div className="absolute bottom-full right-0 mb-2 flex w-48 flex-col gap-1 rounded-3xl border p-2 shadow-xl" style={{ background: 'var(--color-card)', borderColor: 'var(--color-border)' }}>
                <Link to="/presupuestos" onClick={() => setMoreOpen(false)} className="rounded-2xl px-3 py-2 text-sm hover:bg-black/5">Presupuestos</Link>
                <Link to="/categorias" onClick={() => setMoreOpen(false)} className="rounded-2xl px-3 py-2 text-sm hover:bg-black/5">Categorías</Link>
                <Link to="/perfil" onClick={() => setMoreOpen(false)} className="rounded-2xl px-3 py-2 text-sm hover:bg-black/5">Perfil y ajustes</Link>
              </div>
            )}
          </div>
        </div>
      </nav>
      <BcvFloatingWidget />
    </div>
  )
}
