import { useMemo, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useTransactions, useWallet } from '@/hooks/useTransactions'
import { useTheme } from '@/context/ThemeContext'
import { formatPrivateCurrency } from '@/utils/privateCurrency'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'

function monthKey(date: Date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  return `${year}-${month}`
}

export default function Predictions() {
  const [currentMonth] = useState(() => monthKey(new Date()))
  const { transactions, loading: transactionsLoading, error: transactionsError } = useTransactions()
  const { profile, balance, loading: profileLoading, error: profileError } = useWallet()
  const { hideBalances } = useTheme()
  const currency = profile?.currency_preference ?? 'USD'
  const forecast = useMemo(() => {
    const [currentYear, currentMonthNumber] = currentMonth.split('-').map(Number)
    const completedMonths = Array.from({ length: 3 }, (_, index) => {
      const monthIndex = currentYear * 12 + currentMonthNumber - index - 2
      const year = Math.floor(monthIndex / 12)
      const month = String(monthIndex % 12 + 1).padStart(2, '0')
      return `${year}-${month}`
    })
    const monthly = completedMonths.map((month) => {
      const monthTransactions = transactions.filter((transaction) => transaction.date.startsWith(month))
      return {
        month,
        hasTransactions: monthTransactions.length > 0,
        income: monthTransactions
          .filter((transaction) => transaction.type === 'ingreso')
          .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
        expenses: monthTransactions
          .filter((transaction) => transaction.type === 'egreso')
          .reduce((sum, transaction) => sum + Number(transaction.amount), 0),
      }
    })
    const income = monthly.reduce((sum, month) => sum + month.income, 0) / completedMonths.length
    const expenses = monthly.reduce((sum, month) => sum + month.expenses, 0) / completedMonths.length
    return {
      months: monthly,
      monthsWithData: monthly.filter((month) => month.hasTransactions).length,
      averageIncome: income,
      averageExpenses: expenses,
      averageNet: income - expenses,
    }
  }, [currentMonth, transactions])

  const ready = !transactionsLoading && !profileLoading
  const error = transactionsError || profileError

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div>
          <h1 className="text-lg font-bold">Predicciones</h1>
          <p className="text-sm opacity-75">Proyecciones orientativas de tu saldo</p>
        </div>

        {!ready && <p className="card-cream p-4 text-sm">Cargando tus datos...</p>}
        {error && (
          <p role="alert" className="card-cream p-4 text-sm text-red-600">
            No se pudieron cargar los datos: {error}
          </p>
        )}

        {ready && !error && (
          <>
            <CollapsibleSection
              title={`Proyección a partir de ${formatPrivateCurrency(balance, currency, hideBalances)}`}
              className="card-cream p-5"
              contentClassName="mt-4 flex flex-col gap-2"
            >
              <p className="text-sm opacity-75">
                Promedio mensual de los últimos tres meses completos. Los meses sin movimientos cuentan como cero.
              </p>
              {forecast.monthsWithData < 2 ? (
                <p className="mt-2 text-sm" role="status">
                  Aún hay poco historial para una predicción fiable. Registra movimientos en al menos dos meses completos.
                </p>
              ) : (
                <div className="grid grid-cols-2 gap-3 mt-2">
                  <div className="rounded-3xl p-3" style={{ background: 'var(--color-surface)' }}>
                    <p className="text-xs opacity-75">Ingreso promedio mensual</p>
                    <p className="font-semibold">{formatPrivateCurrency(forecast.averageIncome, currency, hideBalances)}</p>
                  </div>
                  <div className="rounded-3xl p-3" style={{ background: 'var(--color-surface)' }}>
                    <p className="text-xs opacity-75">Gasto promedio mensual</p>
                    <p className="font-semibold">{formatPrivateCurrency(forecast.averageExpenses, currency, hideBalances)}</p>
                  </div>
                </div>
              )}
            </CollapsibleSection>

            {forecast.monthsWithData >= 2 && (
              <>
                <CollapsibleSection
                  title="Escenarios de saldo"
                  className="card-cream p-5"
                  contentClassName="mt-4 flex flex-col gap-3"
                >
                  {[30, 60, 90].map((days) => {
                    const estimated = balance + forecast.averageNet * days / 30
                    const conservativeNet = forecast.averageIncome * 0.9 - forecast.averageExpenses * 1.1
                    const conservative = balance + conservativeNet * days / 30
                    return (
                      <div key={days} className="rounded-3xl p-3" style={{ background: 'var(--color-surface)' }}>
                        <p className="text-sm font-semibold">En {days} días</p>
                        <p className="text-sm">Estimado: {formatPrivateCurrency(estimated, currency, hideBalances)}</p>
                        <p className="text-sm">Conservador: {formatPrivateCurrency(conservative, currency, hideBalances)}</p>
                      </div>
                    )
                  })}
                </CollapsibleSection>
                <p className="text-xs opacity-75">
                  El escenario conservador reduce ingresos un 10% y aumenta gastos un 10%. Son cálculos lineales, no una garantía ni asesoría financiera.
                </p>
              </>
            )}

            <CollapsibleSection
              title="Meses analizados"
              className="card-cream p-5"
              contentClassName="mt-4 flex flex-col gap-2"
            >
              {forecast.months.map((month) => (
                <div key={month.month} className="flex justify-between text-sm">
                  <span>{month.month}</span>
                  <span>{month.hasTransactions ? 'Con movimientos' : 'Sin movimientos'}</span>
                </div>
              ))}
            </CollapsibleSection>
          </>
        )}
      </div>
    </Layout>
  )
}
