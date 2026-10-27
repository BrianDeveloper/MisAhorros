import { useState } from 'react'
import { X, Calendar, FileText } from 'lucide-react'
import { useTransactions } from '@/hooks/useTransactions'
import { useWallet } from '@/hooks/useTransactions'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import * as Icons from 'lucide-react'

interface TransactionModalProps {
  open: boolean
  onClose: () => void
  defaultType?: 'ingreso' | 'egreso'
}

export function TransactionModal({ open, onClose, defaultType = 'egreso' }: TransactionModalProps) {
  const { user } = useAuth()
  const { categories, addTransaction, fetchAll } = useTransactions()
  const { balance, fetchProfile } = useWallet()
  const [type, setType] = useState<'ingreso' | 'egreso'>(defaultType)
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState<string | null>(null)
  const [description, setDescription] = useState('')
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10))
  const [loading, setLoading] = useState(false)

  if (!open) return null

  const filtered = categories.filter((c) => c.type === type)

  const handleSave = async () => {
    if (!user) return
    const num = parseFloat(amount.replace(',', '.'))
    if (isNaN(num) || num <= 0) return
    setLoading(true)
    try {
      await addTransaction({
        type,
        amount: num,
        category_id: categoryId,
        description: description.trim() || null,
        date,
      })
      if (type === 'ingreso') {
        await supabase.from('profiles').update({ balance_actual: balance + num }).eq('user_id', user.id)
      } else {
        await supabase.from('profiles').update({ balance_actual: balance - num }).eq('user_id', user.id)
      }
      await fetchProfile()
      await fetchAll()
      setAmount('')
      setDescription('')
      setCategoryId(null)
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  const getIcon = (name: string) => {
    const Icon = (Icons as any)[name] || Icons.Circle
    return <Icon size={18} />
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-md card-cream rounded-t-4xl sm:rounded-4xl p-5 flex flex-col gap-4 max-h-[92vh] overflow-auto">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Nuevo movimiento</h2>
          <button onClick={onClose} className="rounded-full p-2" style={{ background: 'var(--color-surface)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="flex rounded-3xl p-1" style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>
          <button
            onClick={() => setType('egreso')}
            className={`flex-1 rounded-3xl py-2 text-sm ${type === 'egreso' ? 'font-semibold' : ''}`}
            style={{ background: type === 'egreso' ? 'var(--color-accent)' : 'transparent', color: 'var(--color-text)' }}
          >
            Gasto
          </button>
          <button
            onClick={() => setType('ingreso')}
            className={`flex-1 rounded-3xl py-2 text-sm ${type === 'ingreso' ? 'font-semibold' : ''}`}
            style={{ background: type === 'ingreso' ? 'var(--color-primary)' : 'transparent', color: 'var(--color-primary-foreground)' }}
          >
            Ingreso
          </button>
        </div>
        <div className="flex flex-col items-center gap-1">
          <span className="text-sm opacity-80">Monto</span>
          <input
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
          <div className="grid grid-cols-5 gap-2">
            {filtered.map((c) => (
              <button
                key={c.id}
                onClick={() => setCategoryId(c.id)}
                className="flex flex-col items-center gap-1 rounded-3xl p-2"
                style={{
                  background: categoryId === c.id ? c.color_tag + '33' : 'var(--color-surface)',
                  border: categoryId === c.id ? `1px solid ${c.color_tag}` : '1px solid var(--color-border)',
                }}
              >
                <div className="h-9 w-9 rounded-full flex items-center justify-center" style={{ background: c.color_tag + '55', color: 'var(--color-text)' }}>
                  {getIcon(c.icon)}
                </div>
                <span className="text-[10px] text-center leading-tight">{c.name}</span>
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <label className="text-sm font-semibold flex items-center gap-2">
            <Calendar size={16} /> Fecha
          </label>
          <input
            type="date"
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
          style={{ background: type === 'ingreso' ? 'var(--color-primary)' : 'var(--color-accent)', color: 'var(--color-primary-foreground)' }}
        >
          {loading ? 'Guardando...' : 'Guardar movimiento'}
        </button>
      </div>
    </div>
  )
}
