import { useState } from 'react'
import { X, Calendar, FileText } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useWallet } from '@/hooks/useTransactions'
import { formatCurrency, parsePositiveAmount } from '@/utils/currency'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useTheme } from '@/context/ThemeContext'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  defaultType?: 'ingreso' | 'egreso'
  onSaved?: () => Promise<void> | void
}

function getLocalDateString() {
  const today = new Date()
  const month = String(today.getMonth() + 1).padStart(2, '0')
  const day = String(today.getDate()).padStart(2, '0')
  return `${today.getFullYear()}-${month}-${day}`
}

export function TransactionModal({ open, onClose, defaultType = 'egreso', onSaved }: TransactionModalProps) {
  const { categories, addTransaction } = useTransactions()
  const { balance, profile, loading: profileLoading, error: profileError } = useWallet()
  const { hideBalances } = useTheme()
  const [type, setType] = useState<'ingreso' | 'egreso'>(defaultType)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [today] = useState(getLocalDateString)
  const [date, setDate] = useState(getLocalDateString)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  if (!open) return null

  const filtered = categories.filter((c) => c.type === type)

  const handleSave = async () => {
    const num = parsePositiveAmount(amount)
    if (num === null) {
      setError('Ingresa un monto mayor a cero y con máximo dos decimales.')
      return
    }
    if (!date || date > today) {
      setError('La fecha no puede ser futura.')
      return
    }
    if (type === 'egreso' && (profileLoading || profileError || !profile)) {
      setError(profileError || 'No se pudo verificar el saldo disponible. Inténtalo nuevamente.')
      return
    }
    if (type === 'egreso' && num > balance) {
      setError(hideBalances
        ? 'Saldo insuficiente.'
        : `Saldo insuficiente. Disponible: ${formatCurrency(balance, profile?.currency_preference)}.`)
      return
    }
    setError(null)
    setLoading(true)
    try {
      await addTransaction({
        type,
        amount: num,
        category_id: categoryId,
        description: description.trim() || null,
        date,
      })
      await onSaved?.()
      setAmount('')
      setDescription('')
      setCategoryId(null)
      onClose()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo guardar el movimiento.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full min-w-0 sm:max-w-md card-cream rounded-t-4xl sm:rounded-4xl p-5 flex flex-col gap-4 max-h-[92vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo movimiento</h2>
          <button onClick={onClose} className="rounded-full p-2" style={{ background: 'var(--color-surface)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex rounded-3xl p-1" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <button
            onClick={() => {
              setType('egreso')
              setCategoryId(null)
            }}
            className={`flex-1 rounded-3xl py-2 text-sm ${type === 'egreso' ? 'font-semibold' : ''}`}
            style={{ background: type === 'egreso' ? 'var(--color-primary)' : 'transparent', color: type === 'egreso' ? 'var(--color-primary-foreground)' : 'var(--color-text)' }}
          >
            Gasto
          </button>
          <button
            onClick={() => {
              setType('ingreso')
              setCategoryId(null)
            }}
            className={`flex-1 rounded-3xl py-2 text-sm ${type === 'ingreso' ? 'font-semibold' : ''}`}
            style={{ background: type === 'ingreso' ? 'var(--color-primary)' : 'transparent', color: type === 'ingreso' ? 'var(--color-primary-foreground)' : 'var(--color-text)' }}
          >
            Ingreso
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm opacity-80">Monto</span>
          <input
            type="text"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0.00"
            className="text-center text-4xl font-bold bg-transparent outline-none"
            style={{ color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-sm font-semibold">Categoría</span>
          <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
            {filtered.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => setCategoryId(c.id)}
                aria-pressed={categoryId === c.id}
                title={c.name}
                style={{
                  background: categoryId === c.id ? `${c.color || '#fbbf24'}33` : 'var(--color-surface)',
                  border: categoryId === c.id ? `1px solid ${c.color || '#fbbf24'}` : '1px solid var(--color-border)',
                }}
                className="flex min-w-0 flex-col items-center gap-1 rounded-3xl p-2"
              >
                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full" style={{ background: `${c.color || '#fbbf24'}55`, color: 'var(--color-text)' }}>
                  <CategoryIcon name={c.icon} categoryName={c.name} />
                </div>
                <span className="line-clamp-2 w-full break-all text-center text-[10px] leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
          {filtered.length === 0 && <p className="text-xs opacity-70">No hay categorías de {type === 'ingreso' ? 'ingresos' : 'gastos'} todavía. Puedes guardar el movimiento sin categoría.</p>}
        </div>
        {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Calendar size={16} /> Fecha
          </label>
          <input
            type="date"
            max={today}
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <FileText size={16} /> Descripción (opcional)
          </label>
          <input
            maxLength={120}
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Agrega una nota"
            className="rounded-3xl px-4 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
        </div>
        <button
          disabled={loading}
          onClick={handleSave}
          className="rounded-3xl py-3 font-semibold"
          style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
        >
          {loading ? 'Guardando...' : 'Guardar movimiento'}
        </button>
      </div>
    </div>
  )
}
