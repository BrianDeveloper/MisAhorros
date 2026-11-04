import type { CurrencyPreference } from '@/types/database'

export function formatCurrency(amount: number, currency: CurrencyPreference = 'USD') {
  const locale = currency === 'VES' ? 'es-VE' : 'en-US'
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  }).format(amount)
}

export function parsePositiveAmount(value: string): number | null {
  const normalized = value.trim().replace(',', '.')
  if (!/^(?:\d+(?:\.\d{1,2})?|\.\d{1,2})$/.test(normalized)) return null
  const amount = Number(normalized)
  return Number.isFinite(amount) && amount > 0 && amount <= 999_999_999_999.99 ? amount : null
}

export function formatShortDate(value: string): string {
  const match = /^(\d{4})-(\d{2})-(\d{2})/.exec(value)
  if (!match) return value
  const [, year, month, day] = match
  return `${day}/${month}/${year.slice(-2)}`
}
