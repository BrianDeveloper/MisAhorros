import { useMemo, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { Filter, Trash2 } from 'lucide-react'
import * as Icons from 'lucide-react'
import { useWallet } from '@/hooks/useTransactions'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'

export default function Transactions() {
  const { user } = useAuth()
  const { transactions, categories, deleteTransaction, fetchAll } = useTransactions()
  const { balance, fetchProfile } = useWallet()
  const [filterMonth, setFilterMonth] = useState(() => new Date().toISOString().slice(0, 7))
  const [filterCat, setFilterCat] = useState<string>('all')
  const [open, setOpen] = useState(false)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const monthOk = t.date.startsWith(filterMonth)
      const catOk = filterCat === 'all' ? true : t.category_id === filterCat
      return monthOk && catOk
    })
  }, [transactions, filterMonth, filterCat])

  const getIcon = (icon?: string | null) => {
    const Icon = icon && (Icons as any)[icon] ? (Icons as any)[icon] : Icons.Circle
    return <Icon size={18} />
  }

  const handleDelete = async (t: any) => {
    if (!user) return
    const num = Number(t.amount)
    if (t.type === 'ingreso') {
      await supabase.from('profiles').update({ balance_actual: balance - num }).eq('user_id', user.id)
    } else {
      await supabase.from('profiles').update({ balance_actual: balance + num }).eq('user_id', user.id)
    }
    await deleteTransaction(t.id)
    await fetchProfile()
    await fetchAll()
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Movimientos</h1>
          <button onClick={() => setOpen(true)} className="rounded-3xl px-3 py-2 text-sm" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
            + Nuevo
          </button>
        </div>

        <div className="card-cream p-3 flex flex-col gap-2">
          <div className="flex items-center gap-2 text-sm">
            <Filter size={16} />
            <span>Filtros</span>
          </div>
          <div className="flex gap-2">
            <input
              type="month"
              value={filterMonth}
              onChange={(e) => setFilterMonth(e.target.value)}
              className="flex-1 rounded-3xl px-3 py-2 text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="flex-1 rounded-3xl px-3 py-2 text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="flex flex-col gap-2">
          {filtered.map((t) => (
            <div key={t.id} className="card-cream p-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="h-10 w-10 rounded-full flex items-center justify-center" style={{ background: (t.categories?.color_tag || '#fbbf24') + '55' }}>
                  {getIcon(t.categories?.icon)}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.categories?.name || 'Sin categoría'}</p>
                  <p className="text-xs opacity-70">
                    {t.date} {t.description ? `• ${t.description}` : ''}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-sm font-semibold">{t.type === 'ingreso' ? '+' : '-'} ${Number(t.amount).toFixed(2)}</span>
                <button onClick={() => handleDelete(t)} className="rounded-full p-2">
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center text-sm opacity-70 py-6">Sin movimientos para este filtro</p>}
        </div>
      </div>
      <TransactionModal open={open} onClose={() => setOpen(false)} />
    </Layout>
  )
}
