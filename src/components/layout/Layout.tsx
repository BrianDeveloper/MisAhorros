import { useState } from 'react'
import { useTheme } from '@/context/ThemeContext'
import { Palette, Home, ArrowLeftRight, Target, Settings, User } from 'lucide-react'

interface LayoutProps {
  children: React.ReactNode
}

const navItems = [
  { label: 'Inicio', icon: Home, href: '/' },
  { label: 'Movimientos', icon: ArrowLeftRight, href: '/movimientos' },
  { label: 'Metas', icon: Target, href: '/metas' },
  { label: 'Ajustes', icon: Settings, href: '/ajustes' },
]

export function Layout({ children }: LayoutProps) {
  const { theme, setTheme, themes } = useTheme()
  const [open, setOpen] = useState(false)
  const current = themes.find((t) => t.value === theme)

  return (
    <div
      className="min-h-screen flex flex-col"
      style={{ background: 'radial-gradient(1400px 900px at 50% 0%, var(--color-bg) 0%, #FFFFFF 100%)' }}
    >
      <header className="sticky top-0 z-20 px-4 pt-4">
        <div className="card-cream flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div
              className="h-10 w-10 rounded-full flex items-center justify-center"
              style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
            >
              <User size={18} />
            </div>
            <div>
              <p className="text-sm font-semibold leading-tight">MisAhorros</p>
              <p className="text-xs opacity-80 leading-tight">Finanzas con estilo cremosito</p>
            </div>
          </div>
          <div className="relative">
            <button
              onClick={() => setOpen((v) => !v)}
              className="flex items-center gap-2 rounded-3xl px-3 py-2 text-sm shadow-bubble"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            >
              <Palette size={16} />
              <span>
                {current?.emoji} {current?.label.split(' ')[0]}
              </span>
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

      <nav className="fixed bottom-0 left-0 right-0 z-30 px-3 pb-2">
        <div className="bottom-nav mx-auto max-w-md flex items-center justify-around px-2 py-2">
          {navItems.map((item) => {
            const Icon = item.icon
            return (
              <button
                key={item.href}
                className="flex flex-col items-center gap-1 rounded-3xl px-3 py-1.5 text-xs"
                style={{ color: 'var(--color-text)' }}
              >
                <Icon size={20} />
                <span>{item.label}</span>
              </button>
            )
          })}
        </div>
      </nav>
    </div>
  )
}
