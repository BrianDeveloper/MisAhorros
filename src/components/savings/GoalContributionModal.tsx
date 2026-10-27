import { useState } from 'react'
import { X, ArrowDownCircle, ArrowUpCircle, Sparkles } from 'lucide-react'
import { useSavings } from '@/hooks/useSavings'
import { useWallet } from '@/hooks/useTransactions'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

interface GoalContributionModalProps {
  open: boolean
  onClose: () => void
  goal: any | null
  mode: 'abonar' | 'retirar'
}

export function GoalContributionModal({ open, onClose, goal, mode }: GoalContributionModalProps) {
  const { user } = useAuth()
  const { contribute, withdraw } = useSavings()
  const { balance, fetchProfile } = useWallet()
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(false)
  const [showCelebration, setShowCelebration] = useState(false)

  if (!open || !goal) return null

  const target = Number(goal.target_amount)
  const current = Number(goal.current_amount)
  const progress = Math.min(100, (current / target) * 100)

  const handleSave = async () => {
    if (!user) return
    const num = parseFloat(amount.replace(',', '.'))
    if (isNaN(num) || num <= 0) return
    setLoading(true)
    try {
      if (mode === 'abonar') {
        if (num > balance) throw new Error('Saldo insuficiente')
        await contribute(goal.id, num)
        await supabase.from('profiles').update({ balance_actual: balance - num }).eq('user_id', user.id)
        const newCurrent = current + num
        if (newCurrent >= target && progress < 100) {
          setShowCelebration(true)
          setTimeout(() => setShowCelebration(false), 1800)
        }
      } else {
        if (num > current) throw new Error('No hay suficiente en la meta')
        await withdraw(goal.id, num)
        await supabase.from('profiles').update({ balance_actual: balance + num }).eq('user_id', user.id)
      }
      await fetchProfile()
      setAmount('')
      onClose()
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
      <div className="absolute inset-0 bg-black/20" onClick={onClose} />
      <div className="relative w-full sm:max-w-md card-cream rounded-t-4xl sm:rounded-4xl p-5 flex flex-col gap-4">
        {showCelebration && (
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="rounded-4xl px-6 py-4 flex items-center gap-2" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              <Sparkles size={18} />
              <span className="font-semibold">¡Meta alcanzada! 🎉</span>
            </div>
          </div>
        )}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">{mode === 'abonar' ? 'Abonar a meta' : 'Retirar de meta'}</h2>
          <button onClick={onClose} className="rounded-full p-2" style={{ background: 'var(--color-surface)' }}>
            <X size={18} />
          </button>
        </div>
        <div className="text-center">
          <p className="text-sm opacity-80">{goal.title}</p>
          <p className="text-xs opacity-70">
            Guardado: ${current.toFixed(2)} / Objetivo: ${target.toFixed(2)}
          </p>
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
          <span className="text-xs opacity-70">
            {mode === 'abonar' ? `Saldo disponible: $${balance.toFixed(2)}` : `Disponible en meta: $${current.toFixed(2)}`}
          </span>
        </div>
        <button
          disabled={loading}
          onClick={handleSave}
          className="rounded-3xl py-3 font-semibold flex items-center justify-center gap-2"
          style={{ background: mode === 'abonar' ? 'var(--color-primary)' : 'var(--color-accent)', color: 'var(--color-primary-foreground)' }}
        >
          {mode === 'abonar' ? <ArrowDownCircle size={18} /> : <ArrowUpCircle size={18} />}
          {loading ? 'Procesando...' : mode === 'abonar' ? 'Abonar' : 'Retirar'}
        </button>
      </div>
    </div>
  )
}
