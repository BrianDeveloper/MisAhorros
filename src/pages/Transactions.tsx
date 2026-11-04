import { useMemo, useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useTransactions } from '@/hooks/useTransactions'
import { TransactionModal } from '@/components/transactions/TransactionModal'
import { Filter, Trash2, X } from 'lucide-react'
import { CategoryIcon } from '@/components/CategoryIcon'
import { useWallet } from '@/hooks/useTransactions'
import { formatCurrency, formatShortDate } from '@/utils/currency'
import { useTheme } from '@/context/ThemeContext'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'

function getLocalMonth() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`
}

function getLocalDate() {
  const now = new Date()
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`
}

export default function Transactions() {
  const { transactions, categories, deleteTransaction, fetchAll, loading, error: loadError } = useTransactions()
  const { fetchProfile, profile } = useWallet()
  const { hideBalances } = useTheme()
  const currency = profile?.currency_preference ?? 'USD'
  const [filterFrom, setFilterFrom] = useState(() => `${getLocalMonth()}-01`)
  const [filterTo, setFilterTo] = useState(getLocalDate)
  const [filterCat, setFilterCat] = useState<string>('all')
  const [filterType, setFilterType] = useState<'all' | 'ingreso' | 'egreso'>('all')
  const [search, setSearch] = useState('')
  const [open, setOpen] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      const dateKey = t.date.slice(0, 10)
      const fromOk = !filterFrom || dateKey >= filterFrom
      const toOk = !filterTo || dateKey <= filterTo
      const catOk = filterCat === 'all' ? true : t.category_id === filterCat
      const typeOk = filterType === 'all' || t.type === filterType
      const normalizedSearch = search.trim().toLocaleLowerCase('es')
      const searchOk = !normalizedSearch || [t.description, t.categories?.name]
        .some((value) => value?.toLocaleLowerCase('es').includes(normalizedSearch))
      return fromOk && toOk && catOk && typeOk && searchOk
    })
  }, [transactions, filterFrom, filterTo, filterCat, filterType, search])

  const handleDelete = async (id: string) => {
    setError(null)
    try {
      await deleteTransaction(id)
      await fetchProfile()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'No se pudo eliminar el movimiento.')
    }
  }

  const refreshTransactions = async () => {
    await Promise.all([fetchAll(), fetchProfile()])
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

        <CollapsibleSection
          title="Filtros"
          icon={<Filter size={16} />}
          detail={<span className="text-xs opacity-70">{filtered.length} resultados</span>}
          className="card-cream p-3"
        >
          <label className="flex flex-col gap-1 text-xs">
            Buscar por descripción o categoría
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Ej. supermercado"
              className="min-w-0 rounded-3xl px-3 py-2 text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </label>
          <div className="grid min-w-0 grid-cols-2 gap-2">
            <label className="flex min-w-0 flex-col gap-1 text-xs">
              Desde
              <input
                type="date"
                value={filterFrom}
                max={filterTo || undefined}
                onChange={(event) => setFilterFrom(event.target.value)}
                className="min-w-0 rounded-3xl px-3 py-2 text-sm"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </label>
            <label className="flex min-w-0 flex-col gap-1 text-xs">
              Hasta
              <input
                type="date"
                value={filterTo}
                min={filterFrom || undefined}
                onChange={(event) => setFilterTo(event.target.value)}
                className="min-w-0 rounded-3xl px-3 py-2 text-sm"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              />
            </label>
          </div>
          <div className="flex min-w-0 flex-col gap-2 sm:flex-row">
            <select
              aria-label="Tipo de movimiento"
              value={filterType}
              onChange={(event) => {
                if (event.target.value === 'all' || event.target.value === 'ingreso' || event.target.value === 'egreso') {
                  setFilterType(event.target.value)
                }
              }}
              className="min-w-0 flex-1 rounded-3xl px-3 py-2 text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="all">Ingresos y gastos</option>
              <option value="ingreso">Ingresos</option>
              <option value="egreso">Gastos</option>
            </select>
            <select
              value={filterCat}
              onChange={(e) => setFilterCat(e.target.value)}
              className="min-w-0 flex-1 rounded-3xl px-3 py-2 text-sm"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              <option value="all">Todas las categorías</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
            <button
              type="button"
              onClick={() => {
                setFilterFrom('')
                setFilterTo('')
                setFilterCat('all')
                setFilterType('all')
                setSearch('')
              }}
              className="inline-flex items-center justify-center gap-1 rounded-3xl px-3 py-2 text-sm"
              style={{ background: 'var(--color-surface)' }}
            >
              <X size={14} /> Limpiar
            </button>
          </div>
        </CollapsibleSection>

        <div className="flex flex-col gap-2">
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {loadError && <p role="alert" className="text-sm text-red-600">No se pudieron cargar los movimientos: {loadError}</p>}
          {loading && <p role="status" className="py-4 text-center text-sm opacity-70">Cargando movimientos...</p>}
          {!loading && !loadError && filtered.map((t) => {
            const isIncome = t.type === 'ingreso'
            return (
            <div key={t.id} className="card-cream flex min-w-0 items-center justify-between gap-2 border-l-4 p-3 sm:p-4" style={{ borderLeftColor: isIncome ? '#16a34a' : '#dc2626' }}>
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: isIncome ? 'rgba(22, 163, 74, 0.14)' : 'rgba(220, 38, 38, 0.12)', color: isIncome ? '#15803d' : '#b91c1c' }}>
                  <CategoryIcon name={t.categories?.icon} categoryName={t.categories?.name} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="line-clamp-1 break-all text-sm font-medium">{t.categories?.name || 'Sin categoría'}</p>
                  <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1 text-xs opacity-70">
                    <time dateTime={t.date}>{formatShortDate(t.date)}</time>
                    <span className="font-semibold" style={{ color: isIncome ? '#15803d' : '#b91c1c' }}>
                      {isIncome ? 'Ingreso' : 'Gasto'}
                    </span>
                  </div>
                  {t.description && <p className="line-clamp-2 break-all text-xs opacity-70">{t.description}</p>}
                </div>
              </div>
              <div className="flex shrink-0 items-center gap-1 sm:gap-2">
                <span className="max-w-[7rem] break-all text-right text-xs font-bold sm:text-sm" style={{ color: isIncome ? '#15803d' : '#b91c1c' }}>
                  {hideBalances ? '******' : `${isIncome ? '+' : '−'} ${formatCurrency(Number(t.amount), currency)}`}
                </span>
                <button type="button" onClick={() => handleDelete(t.id)} className="shrink-0 rounded-full p-2" aria-label={`Eliminar ${isIncome ? 'ingreso' : 'gasto'}${hideBalances ? '' : ` de ${formatCurrency(Number(t.amount), currency)}`}`}>
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          )})}
          {!loading && !loadError && filtered.length === 0 && <p className="py-6 text-center text-sm opacity-70">Sin movimientos para este filtro</p>}
        </div>
      </div>
      {open && <TransactionModal open={open} onClose={() => setOpen(false)} onSaved={refreshTransactions} />}
    </Layout>
  )
}
