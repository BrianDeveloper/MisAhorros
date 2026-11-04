import { useCallback, useEffect, useRef, useState } from 'react'
import { CircleDollarSign, X } from 'lucide-react'
import { BcvConverter } from '@/components/currency/BcvConverter'

export function BcvFloatingWidget() {
  const [open, setOpen] = useState(false)
  const [mounted, setMounted] = useState(false)
  const panelRef = useRef<HTMLElement>(null)
  const toggleButtonRef = useRef<HTMLButtonElement>(null)

  const openWidget = () => {
    setMounted(true)
    window.requestAnimationFrame(() => setOpen(true))
  }

  const closeWidget = useCallback(() => {
    setOpen(false)
    toggleButtonRef.current?.focus()
  }, [])

  useEffect(() => {
    if (!open) return
    panelRef.current?.focus()
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') closeWidget()
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open, closeWidget])

  return (
    <>
      {mounted && (
        <>
          <button
            type="button"
            aria-label="Cerrar consulta BCV"
            onClick={closeWidget}
            className={`bcv-widget-dismiss fixed inset-0 z-[35] ${open ? 'bcv-widget-dismiss-open' : 'bcv-widget-dismiss-closed'}`}
          />
          <aside
            ref={panelRef}
            id="bcv-floating-widget"
            role="dialog"
            aria-label="Consulta externa de tasa BCV"
            aria-modal="false"
            tabIndex={-1}
            onAnimationEnd={(event) => {
              if (event.target === event.currentTarget && !open && event.animationName === 'bcv-widget-out') {
                setMounted(false)
              }
            }}
            className={`bcv-widget-panel fixed z-40 w-[min(17rem,calc(100vw-2rem))] overflow-y-auto rounded-3xl ${open ? 'bcv-widget-panel-open' : 'bcv-widget-panel-closed'}`}
            style={{
              right: 'max(1rem, calc((100vw - 28rem) / 2))',
              bottom: 'calc(9rem + env(safe-area-inset-bottom))',
              maxHeight: 'calc(100dvh - 10rem - env(safe-area-inset-bottom))',
            }}
          >
            <div className="card-cream p-2">
              <BcvConverter compact />
            </div>
          </aside>
        </>
      )}
      <button
        ref={toggleButtonRef}
        type="button"
        onClick={() => {
          if (open) closeWidget()
          else openWidget()
        }}
        aria-expanded={open}
        aria-controls="bcv-floating-widget"
        aria-label={open ? 'Cerrar consulta BCV' : 'Consultar tasa BCV'}
        title={open ? 'Cerrar consulta de tasa' : 'Consultar tasa oficial USD/VES'}
        className="fixed z-40 flex h-12 w-12 items-center justify-center rounded-full shadow-xl transition-transform hover:scale-105 focus-visible:outline-2 focus-visible:outline-offset-2"
        style={{
          right: 'max(1rem, calc((100vw - 28rem) / 2))',
          bottom: 'calc(5.5rem + env(safe-area-inset-bottom))',
          background: 'var(--color-primary)',
          color: 'var(--color-primary-foreground)',
        }}
      >
        {open ? <X size={20} /> : <CircleDollarSign size={21} />}
      </button>
    </>
  )
}
