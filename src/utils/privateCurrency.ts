import { formatCurrency } from '@/utils/currency'
import type { CurrencyPreference } from '@/types/database'

export function formatPrivateCurrency(
  amount: number,
  currency: CurrencyPreference,
  hidden: boolean,
) {
  return hidden ? '******' : formatCurrency(amount, currency)
}
