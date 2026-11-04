import { useState } from 'react'
import { ArrowDownUp, RefreshCw } from 'lucide-react'
import { useBcvRate } from '@/hooks/useBcvRate'
import { formatCurrency, parsePositiveAmount } from '@/utils/currency'

function formatRate(rate: number) {
  return new Intl.NumberFormat('es-VE', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 8,
  }).format(rate)
}

function formatRateDate(date: string) {
  const [year, month, day] = date.split('-').map(Number)
  if (!year || !month || !day) return date
  return new Intl.DateTimeFormat('es-VE', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    timeZone: 'UTC',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function BcvConverter({ compact = false }: { compact?: boolean }) {
  const { rate, date, loading, error, refresh } = useBcvRate()
  const [amount, setAmount] = useState('')
  const [fromCurrency, setFromCurrency] = useState<'USD' | 'VES'>('USD')
  const parsedAmount = amount.trim() === '' ? null : parsePositiveAmount(amount)
  const convertedAmount = rate && parsedAmount !== null
    ? fromCurrency === 'USD' ? parsedAmount * rate : parsedAmount / rate
    : null
  const toCurrency = fromCurrency === 'USD' ? 'VES' : 'USD'

  return (
    <section className={`${compact ? 'min-w-0 p-2' : 'card-cream min-w-0 p-4'} flex flex-col gap-3`} aria-labelledby="bcv-converter-heading">
      <div className="flex min-w-0 items-center justify-between gap-2">
        <div className="min-w-0">
          <h2 id="bcv-converter-heading" className="font-semibold">{compact ? 'Tasa oficial USD/VES' : 'Conversor BCV'}</h2>
          {!compact && <p className="text-xs opacity-70">Solo referencia; no modifica tus registros</p>}
        </div>
        <button
          type="button"
          onClick={() => void refresh()}
          disabled={loading}
          aria-label="Actualizar tasa BCV"
          className="shrink-0 rounded-full p-2 disabled:opacity-50"
          style={{ background: 'var(--color-surface)' }}
        >
          <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
        </button>
      </div>

      <div className="flex min-w-0 gap-2">
        <input
          id="bcv-amount"
          type="text"
          inputMode="decimal"
          autoComplete="off"
          value={amount}
          onChange={(event) => setAmount(event.target.value)}
          placeholder="0,00"
          className="min-w-0 flex-1 rounded-3xl px-3 py-2 text-sm"
          aria-label="Monto a convertir"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        />
        <button
          type="button"
          onClick={() => setFromCurrency(toCurrency)}
          aria-label={`Cambiar dirección de conversión a ${toCurrency}`}
          className="shrink-0 rounded-3xl px-3"
          style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <span className="flex items-center gap-1 text-xs font-semibold">
            {fromCurrency} <ArrowDownUp size={14} /> {toCurrency}
          </span>
        </button>
      </div>

      {amount && parsedAmount === null && (
        <p role="alert" className="text-xs text-red-600">Ingresa un monto positivo con hasta dos decimales.</p>
      )}
      {loading && <p role="status" className="text-xs opacity-70">Consultando la tasa oficial...</p>}
      {error && (
        <div role="alert" className="flex flex-col gap-2 text-xs text-red-600">
          <p>{error}</p>
          <button type="button" onClick={() => void refresh()} className="self-start underline">Reintentar</button>
        </div>
      )}
      {!loading && !error && rate && date && (
        <>
          {convertedAmount !== null && parsedAmount !== null && (
            <p className={`break-words font-bold ${compact ? 'text-base' : 'text-xl'}`}>
              {formatCurrency(parsedAmount, fromCurrency)} = {formatCurrency(convertedAmount, toCurrency)}
            </p>
          )}
          <p className="break-words text-xs opacity-75">
            1 USD = {formatRate(rate)} VES · Tasa del {formatRateDate(date)}
          </p>
        </>
      )}
    </section>
  )
}
