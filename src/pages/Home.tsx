import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useWallet } from '@/hooks/useTransactions'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { Plus, Minus, ArrowRight } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'
import { Link } from 'react-router-dom'
import { formatCurrency, formatShortDate } from '@/utils/currency'
import { useBcvRate } from '@/hooks/useBcvRate'
import { Eye, EyeOff } from 'lucide-react'
import { useTheme } from '@/context/ThemeContext'
import { formatPrivateCurrency } from '@/utils/privateCurrency'

export default function Home() {
  const { balance, profile, fetchProfile } = useWallet()
  const { transactions, fetchAll } = useTransactions()
  const { hideBalances, setHideBalances } = useTheme()
  const currency = profile?.currency_preference ?? 'USD'
  const { rate, date: rateDate, loading: rateLoading, error: rateError, refresh: refreshRate } = useBcvRate(false)
  const [open, setOpen] = useState(false)
  const [type, setType] = useState<'ingreso' | 'egreso'>('egreso')
  const [showBalanceInVes, setShowBalanceInVes] = useState(false)
  const [conversionError, setConversionError] = useState<string | null>(null)

  const ingresos = transactions
    .filter((t) => t.type === 'ingreso')
    .reduce((sum, t) => sum + Number(t.amount), 0)
  const egresos = transactions
    .filter((t) => t.type === 'egreso')
    .reduce((sum, t) => sum + Number(t.amount), 0)

  const recent = transactions.slice(0, 5)

  const refreshHome = async () => {
    await Promise.all([fetchAll(), fetchProfile()])
  }

  const handleBalanceCurrencyToggle = async () => {
    if (hideBalances) return
    setConversionError(null)
    if (showBalanceInVes) {
      setShowBalanceInVes(false)
      return
    }
    if (!rate) {
      const currentRate = await refreshRate()
      if (!currentRate) {
        setConversionError(rateError || 'No se pudo consultar la tasa oficial. Inténtalo más tarde.')
        return
      }
    }
    setShowBalanceInVes(true)
  }

  const displayedBalance = showBalanceInVes && rate ? balance * rate : balance
  const displayedCurrency = showBalanceInVes && rate ? 'VES' : currency

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="card-cream p-6 relative overflow-hidden">
          <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full" style={{ background: 'var(--color-primary)', opacity: 0.18 }} />
          <div className="relative flex flex-col gap-1">
            <span className="text-sm opacity-80">Saldo total</span>
            <div className="flex min-w-0 items-center gap-2">
              <button
                type="button"
                onClick={() => setHideBalances(!hideBalances)}
                aria-label={hideBalances ? 'Mostrar importes' : 'Ocultar importes'}
                className="shrink-0 rounded-full p-2"
                style={{ background: 'var(--color-surface)' }}
              >
                {hideBalances ? <Eye size={18} /> : <EyeOff size={18} />}
              </button>
              {currency === 'USD' ? (
              <button
                type="button"
                onClick={() => void handleBalanceCurrencyToggle()}
                disabled={rateLoading || hideBalances}
                aria-label={showBalanceInVes ? 'Mostrar saldo en dólares' : 'Mostrar saldo en bolívares'}
                aria-live="polite"
                className="min-w-0 break-all text-left text-3xl font-bold hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 disabled:cursor-default disabled:opacity-70 sm:text-4xl"
              >
                {formatPrivateCurrency(displayedBalance, displayedCurrency, hideBalances)}
              </button>
            ) : (
              <span className="min-w-0 break-all text-3xl font-bold sm:text-4xl">{formatPrivateCurrency(balance, currency, hideBalances)}</span>
            )}
            </div>
            {showBalanceInVes && rate ? (
              <span className="text-xs opacity-70">Equivalente en VES · tasa oficial del {rateDate}</span>
            ) : currency === 'USD' && rateLoading && showBalanceInVes ? (
              <span role="status" className="text-xs opacity-70">Consultando tasa oficial...</span>
            ) : (
              <span className="text-xs opacity-70">
                {currency === 'USD' ? 'Toca el saldo para verlo en bolívares' : 'Tu saldo ya está expresado en bolívares'}
              </span>
            )}
            {showBalanceInVes && <span className="text-xs opacity-70">Toca el saldo para volver a USD</span>}
            {conversionError && <span role="alert" className="text-xs text-red-600">{conversionError}</span>}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="card-cream min-w-0 p-4 flex flex-col gap-1">
            <span className="text-xs opacity-80">Ingresos</span>
            <span className="break-all text-lg font-semibold sm:text-xl">{formatPrivateCurrency(ingresos, currency, hideBalances)}</span>
          </div>
          <div className="card-cream min-w-0 p-4 flex flex-col gap-1">
            <span className="text-xs opacity-80">Gastos</span>
            <span className="break-all text-lg font-semibold sm:text-xl">{formatPrivateCurrency(egresos, currency, hideBalances)}</span>
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
            <Link to="/movimientos" className="flex items-center gap-1 text-xs opacity-80">
              Ver todo <ArrowRight size={14} />
            </Link>
          </div>
          {recent.length === 0 && <p className="text-sm opacity-70">Aún no hay movimientos</p>}
          {recent.map((t) => (
            <div key={t.id} className="flex min-w-0 items-center justify-between gap-2">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full"
                  style={{ background: t.type === 'ingreso' ? 'rgba(22, 163, 74, 0.14)' : 'rgba(220, 38, 38, 0.12)', color: t.type === 'ingreso' ? '#15803d' : '#b91c1c' }}
                >
                  <CategoryIcon name={t.categories?.icon} categoryName={t.categories?.name} />
                </div>
                <div className="min-w-0">
                  <p className="line-clamp-1 break-all text-sm font-medium">{t.categories?.name || t.description || 'Movimiento'}</p>
                  <p className="text-xs opacity-70">{formatShortDate(t.date)}</p>
                </div>
              </div>
              <span className="max-w-[46%] shrink-0 break-all text-right text-xs font-bold sm:text-sm" style={{ color: t.type === 'ingreso' ? '#15803d' : '#b91c1c' }}>
                {hideBalances ? '******' : `${t.type === 'ingreso' ? '+' : '-'} ${formatCurrency(Number(t.amount), currency)}`}
              </span>
            </div>
          ))}
        </div>
      </div>
      {open && <TransactionModal open={open} onClose={() => setOpen(false)} defaultType={type} onSaved={refreshHome} />}
    </Layout>
  )
}
