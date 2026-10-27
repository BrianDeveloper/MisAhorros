import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useWallet } from '@/hooks/useTransactions'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { Plus, Minus, ArrowRight } from 'lucide-react'
import * as Icons from 'lucide-react'

export default function Home() {
  const { balance } = useWallet()
  const { transactions } = useTransactions()
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'ingreso' | 'egreso'>('egreso')

  const ingresos = transactions
    .filter((t) => t.type === 'ingreso')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const egresos = transactions
    .filter((t) => t.type === 'egreso')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const recent = transactions.slice(0, 5)

  const getIcon = (icon?: string | null) => {
    const Icon = icon && (Icons as any)[icon] ? (Icons as any)[icon] : Icons.Circle
    return <Icon size={18} />
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="card-cream p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full" style={{ background: 'var(--color-primary)', opacity: 0.18 }} />
          <div className="relative flex flex-col gap-1">
            <span className="text-sm opacity-80">Saldo total</span>
            <span className="text-4xl font-bold">${balance.toFixed(2)}</span>
            <span className="text-xs opacity-70">Actualizado al instante</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card-cream p-4 flex flex-col gap-1">
            <span className="text-xs opacity-80">Ingresos</span>
            <span className="text-xl font-semibold">${ingresos.toFixed(2)}</span>
          </div>
          <div className="card-cream p-4 flex flex-col gap-1">
            <span className="text-xs opacity-80">Gastos</span>
            <span className="text-xl font-semibold">${egresos.toFixed(2)}</span>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => {
              setType('ingreso')
              setOpen(true)
            }}
            className="flex-1 rounded-3xl py-3 flex items-center justify-center gap-2 font-semibold"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            <Plus size={18} /> + Ingreso
          </button>
          <button
            onClick={() => {
              setType('egreso')
              setOpen(true)
            }}
            className="flex-1 rounded-3xl py-3 flex items-center justify-center gap-2 font-semibold"
            style={{ background: 'var(--color-accent)', color: 'var(--color-text)' }}
          >
            <Minus size={18} /> - Gasto
          </button>
        </div>

        <div className="card-cream p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="font-semibold">Últimos movimientos</span>
            <button className="flex items-center gap-1 text-xs opacity-80">
              Ver todo <ArrowRight size={14} />
            </button>
          </div>
          {recent.length === 0 && <p className="text-sm opacity-70">Aún no hay movimientos</p>}
          {recent.map((t) => (
            <div key={t.id} className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="h-9 w-9 rounded-full flex items-center justify-center"
                  style={{ background: (t.categories?.color_tag || '#fbbf24') + '55' }}
                >
                  {getIcon(t.categories?.icon)}
                </div>
                <div>
                  <p className="text-sm font-medium">{t.categories?.name || t.description || 'Movimiento'}</p>
                  <p className="text-xs opacity-70">{t.date}</p>
                </div>
              </div>
              <span className={`text-sm font-semibold ${t.type === 'ingreso' ? '' : ''}`} style={{ color: t.type === 'ingreso' ? 'var(--color-primary-foreground)' : 'var(--color-text)' }}>
                {t.type === 'ingreso' ? '+' : '-'} ${Number(t.amount).toFixed(2)}
              </span>
            </div>
          ))}
        </div>
      </div>
      <TransactionModal open={open} onClose={() => setOpen(false)} defaultType={type} />
    </Layout>
  )
}
