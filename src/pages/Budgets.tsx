import { useEffect, useMemo, useState } from 'react'
import type { FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { useAuth } from '@/context/AuthContext'
import { useTheme } from '@/context/ThemeContext'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import { useTransactions, useWallet } from '@/hooks/useTransactions'
import { supabase } from '@/lib/supabaseClient'
import { formatPrivateCurrency } from '@/utils/privateCurrency'
import { formatCurrency, parsePositiveAmount } from '@/utils/currency'
import type { Database } from '@/types/database'

type Budget = Database['public']['Tables']['budgets']['Row']

function getCurrentMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

export default function Budgets() {
  const { user } = useAuth()
  const {
    transactions,
    categories,
    loading: transactionsLoading,
    error: transactionsError,
  } = useTransactions()
  const { profile } = useWallet()
  const { hideBalances } = useTheme()
  const currency = profile?.currency_preference ?? 'USD'
  const [month, setMonth] = useState(getCurrentMonth)
  const [budgets, setBudgets] = useState<Budget[]>([])
  const [categoryId, setCategoryId] = useState('')
  const [amount, setAmount] = useState('')
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  const expenseCategories = useMemo(() => categories.filter((category) => category.type === 'egreso'), [categories])
  const monthDate = `${month}-01`

  useEffect(() => {
    let active = true
    const loadBudgets = async () => {
      setLoading(true)
      setError(null)
      if (!user) {
        setBudgets([])
        setLoading(false)
        return
      }
      const { data, error: queryError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', monthDate)
        .order('created_at')
      if (!active) return
      if (queryError) {
        const migrationHint = queryError.code === 'PGRST205'
          ? ' Aplica la migración 20261104130000_monthly_budgets.sql y vuelve a intentarlo.'
          : ''
        setError(`No se pudieron cargar los presupuestos: ${queryError.message}.${migrationHint}`)
      } else {
        setBudgets(data ?? [])
      }
      setLoading(false)
    }
    void loadBudgets()
    return () => { active = false }
  }, [user, monthDate])

  const spentByCategory = useMemo(() => {
    const totals = new Map<string, number>()
    for (const transaction of transactions) {
      if (transaction.type !== 'egreso' || transaction.date.slice(0, 7) !== month) continue
      if (!transaction.category_id) continue
      totals.set(transaction.category_id, (totals.get(transaction.category_id) ?? 0) + Number(transaction.amount))
    }
    return totals
  }, [transactions, month])

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const parsedAmount = parsePositiveAmount(amount)
    if (!user || !categoryId) {
      setError('Crea o selecciona una categoría de gasto antes de definir un presupuesto.')
      return
    }
    if (!/^\d{4}-(0[1-9]|1[0-2])$/.test(month)) {
      setError('Selecciona un mes válido para el presupuesto.')
      return
    }
    if (!parsedAmount) {
      setError('Ingresa un límite válido mayor que cero, con hasta dos decimales.')
      return
    }
    setSaving(true)
    const { error: saveError } = await supabase
      .from('budgets')
      .upsert(
        { user_id: user.id, category_id: categoryId, month: monthDate, amount: parsedAmount },
        { onConflict: 'user_id,category_id,month' },
      )
    if (saveError) {
      setError(`No se pudo guardar el presupuesto: ${saveError.message}`)
    } else {
      setAmount('')
      setSuccess('Presupuesto guardado para el mes seleccionado.')
      const { data, error: queryError } = await supabase
        .from('budgets')
        .select('*')
        .eq('user_id', user.id)
        .eq('month', monthDate)
        .order('created_at')
      if (queryError) setError(`Se guardó el presupuesto, pero no se pudo actualizar la lista: ${queryError.message}`)
      else setBudgets(data ?? [])
    }
    setSaving(false)
  }

  const handleDelete = async (id: string) => {
    if (!user) {
      setError('Inicia sesión para administrar tus presupuestos.')
      return
    }
    setError(null)
    setSuccess(null)
    const { error: deleteError } = await supabase.from('budgets').delete().eq('id', id).eq('user_id', user.id)
    if (deleteError) {
      setError(`No se pudo eliminar el presupuesto: ${deleteError.message}`)
      return
    }
    setBudgets((items) => items.filter((item) => item.id !== id))
    setSuccess('Presupuesto eliminado.')
  }

  const categoryName = (id: string) => categories.find((category) => category.id === id)?.name ?? 'Categoría eliminada'

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold">Presupuestos mensuales</h1>
        <label className="card-cream flex items-center justify-between gap-3 p-4 text-sm">
          Mes
          <input
            type="month"
            value={month}
            onChange={(event) => setMonth(event.target.value || getCurrentMonth())}
            className="min-w-0 rounded-3xl px-3 py-2"
            style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
          />
        </label>

        <CollapsibleSection title="Definir límite por categoría" className="card-cream p-4">
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          {transactionsLoading ? (
            <p role="status" className="text-sm opacity-75">Cargando categorías…</p>
          ) : transactionsError ? (
            <p role="alert" className="text-sm text-red-600">No se pudieron cargar las categorías: {transactionsError}</p>
          ) : expenseCategories.length === 0 ? (
            <p className="text-sm opacity-75">Primero crea una categoría de gasto en Categorías.</p>
          ) : (
            <>
              <label className="flex flex-col gap-1 text-sm">
                Categoría
                <select
                  value={categoryId}
                  onChange={(event) => setCategoryId(event.target.value)}
                  className="min-w-0 rounded-3xl px-3 py-2"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  <option value="">Selecciona una categoría</option>
                  {expenseCategories.map((category) => <option key={category.id} value={category.id}>{category.name}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Límite ({currency})
                <input
                  type="number"
                  inputMode="decimal"
                  min="0.01"
                  step="0.01"
                  max="999999999999.99"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                  className="rounded-3xl px-3 py-2"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                />
              </label>
              <button type="submit" disabled={saving || !categoryId} className="rounded-3xl py-2 font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
                {saving ? 'Guardando…' : 'Guardar presupuesto'}
              </button>
            </>
          )}
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700">{success}</p>}
        </form>
        </CollapsibleSection>

        <CollapsibleSection
          title="Progreso del mes"
          detail={<span className="text-xs opacity-70">{budgets.length}</span>}
          className="card-cream p-4"
          contentClassName="mt-4 flex flex-col gap-2"
        >
          {loading && <p role="status" className="py-4 text-center text-sm opacity-70">Cargando presupuestos…</p>}
          {!loading && transactionsLoading && budgets.length > 0 && <p role="status" className="py-4 text-center text-sm opacity-70">Calculando gastos del mes…</p>}
          {!loading && transactionsError && budgets.length > 0 && <p role="alert" className="text-sm text-red-600">No se pudo calcular el progreso: {transactionsError}</p>}
          {!loading && !error && budgets.length === 0 && <p className="card-cream p-4 text-sm opacity-75">Aún no hay presupuestos para este mes.</p>}
          {!loading && !transactionsLoading && !transactionsError && budgets.map((budget) => {
            const spent = spentByCategory.get(budget.category_id) ?? 0
            const limit = Number(budget.amount)
            const progress = limit > 0 ? Math.min((spent / limit) * 100, 100) : 0
            const remaining = limit - spent
            const status = progress >= 100 ? 'Límite superado' : progress >= 80 ? 'Cerca del límite' : 'Dentro del límite'
            const progressColor = progress >= 100 ? '#dc2626' : progress >= 80 ? '#d97706' : '#16a34a'
            return (
              <article key={budget.id} className="card-cream flex flex-col gap-3 p-4">
                <div className="flex min-w-0 items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="break-words font-semibold">{categoryName(budget.category_id)}</h3>
                    <p className="text-xs opacity-70">{hideBalances ? 'Presupuesto del mes' : status}</p>
                  </div>
                  <button type="button" onClick={() => void handleDelete(budget.id)} aria-label={`Eliminar presupuesto de ${categoryName(budget.category_id)}`} className="shrink-0 rounded-full p-2" style={{ background: 'var(--color-surface)' }}>
                    <Trash2 size={16} />
                  </button>
                </div>
                {!hideBalances && (
                  <div
                    role="progressbar"
                    aria-label={`Gasto de ${categoryName(budget.category_id)}`}
                    aria-valuemin={0}
                    aria-valuemax={100}
                    aria-valuenow={Math.round(progress)}
                    className="h-2 overflow-hidden rounded-full"
                    style={{ background: 'var(--color-surface)' }}
                  >
                    <div className="h-full rounded-full transition-[width]" style={{ width: `${progress}%`, background: progressColor }} />
                  </div>
                )}
                <div className="flex flex-wrap justify-between gap-x-3 gap-y-1 text-sm">
                  <span>Gastado: {formatPrivateCurrency(spent, currency, hideBalances)}</span>
                  <span>Límite: {formatPrivateCurrency(limit, currency, hideBalances)}</span>
                </div>
                {hideBalances ? (
                  <p className="text-xs opacity-75">Importes y progreso ocultos</p>
                ) : (
                  <p className="text-xs opacity-75">
                    {remaining >= 0
                      ? `Disponible: ${formatCurrency(remaining, currency)}`
                      : `Exceso: ${formatCurrency(Math.abs(remaining), currency)}`}
                  </p>
                )}
              </article>
            )
          })}
        </CollapsibleSection>
      </div>
    </Layout>
  )
}
