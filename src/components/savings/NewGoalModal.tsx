import { useState } from 'react'
import { X, Plus } from 'lucide-react'
import { useSavings } from '@/hooks/useSavings'
import { parsePositiveAmount } from '@/utils/currency'
import * as Icons from 'lucide-react'

interface NewGoalModalProps {
  open: boolean
  onClose: () => void
  onSaved?: () => Promise<void> | void
}

const iconOptions = ['PiggyBank', 'ShoppingBag', 'Plane', 'Home', 'Gift', 'Heart', 'Bike', 'Coffee', 'Gamepad2', 'Sparkles']

export function NewGoalModal({ open, onClose, onSaved }: NewGoalModalProps) {
  const { createGoal } = useSavings()
  const [title, setTitle] = useState('')
  const [target, setTarget] = useState('')
  const [icon, setIcon] = useState('PiggyBank')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const getIcon = (name: string) => {
    const Icon = (Icons as any)[name] || Icons.PiggyBank
    return <Icon size={18} />
  }

  const handleSave = async () => {
    const num = parsePositiveAmount(target)
    if (!title.trim() || title.trim().length > 60 || num === null) {
      setError('Ingresa un nombre de hasta 60 caracteres y un objetivo positivo con máximo dos decimales.')
      return
    }
    setError(null)
    setLoading(true)
    try {
      await createGoal({ title: title.trim(), target_amount: num, icon })
      await onSaved?.()
      setTitle('')
      setTarget('')
      setIcon('PiggyBank')
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo crear la meta.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full min-w-0 sm:max-w-md card-cream rounded-t-4xl sm:rounded-4xl p-5 flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nueva meta</h2>
          <button onClick={onClose} className="rounded-full p-2" style={{ background: 'var(--color-surface)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Nombre de la meta</span>
          <input
            maxLength={60}
            required
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Ej. Licuadora, Viaje..."
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Monto objetivo</span>
          <input
            type="text"
            value={target}
            onChange={(e) => setTarget(e.target.value)}
            inputMode="decimal"
            autoComplete="off"
            aria-label="Monto objetivo"
            required
            placeholder="0.00"
            className="rounded-3xl px-4 py-2 text-lg font-semibold"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Ícono</span>
          <div className="grid grid-cols-5 gap-2">
            {iconOptions.map((name) => (
              <button
                key={name}
                onClick={() => setIcon(name)}
                className="h-10 w-10 rounded-full flex items-center justify-center mx-auto"
                style={{
                  background: icon === name ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: icon === name ? 'var(--color-primary-foreground)' : 'var(--color-text)',
                  border: '1px solid var(--color-border)',
                }}
              >
                {getIcon(name)}
              </button>
            ))}
          </div>
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <button
          disabled={loading}
          onClick={handleSave}
          className="rounded-3xl py-3 font-semibold flex items-center justify-center gap-2"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          <Plus size={18} /> {loading ? 'Creando...' : 'Crear meta'}
        </button>
      </div>
    </div>
  )
}
