import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Check, Pencil, Plus, Trash2, X } from 'lucide-react'
import { Layout } from '@/components/layout/Layout'
import { useAuth } from '@/context/AuthContext'
import { supabase } from '@/lib/supabaseClient'
import { CategoryIcon } from '@/components/CategoryIcon'
import { CollapsibleSection } from '@/components/ui/CollapsibleSection'
import type { Database, TransactionType } from '@/types/database'

type Category = Database['public']['Tables']['categories']['Row']

const colors = [
  { value: '#8b5cf6', label: 'Violeta' },
  { value: '#ec4899', label: 'Rosa' },
  { value: '#f97316', label: 'Naranja' },
  { value: '#eab308', label: 'Amarillo' },
  { value: '#22c55e', label: 'Verde' },
  { value: '#06b6d4', label: 'Cian' },
  { value: '#3b82f6', label: 'Azul' },
  { value: '#64748b', label: 'Gris' },
]

const icons = [
  { value: 'Wallet', label: 'Billetera' },
  { value: 'ShoppingCart', label: 'Compras' },
  { value: 'Utensils', label: 'Comida' },
  { value: 'House', label: 'Vivienda' },
  { value: 'Bus', label: 'Transporte' },
  { value: 'HeartPulse', label: 'Salud' },
  { value: 'GraduationCap', label: 'Educación' },
  { value: 'BriefcaseBusiness', label: 'Trabajo' },
  { value: 'TrendingUp', label: 'Inversión' },
  { value: 'PiggyBank', label: 'Ahorro' },
  { value: 'Gamepad2', label: 'Entretenimiento' },
  { value: 'Gift', label: 'Regalo' },
  { value: 'Zap', label: 'Servicios' },
  { value: 'Music', label: 'Música' },
  { value: 'Plane', label: 'Viaje' },
  { value: 'CircleDollarSign', label: 'Dinero' },
]

function fetchUserCategories(userId: string) {
  return supabase
    .from('categories')
    .select('*')
    .eq('user_id', userId)
    .order('type')
    .order('name')
}

export default function Categories() {
  const { user } = useAuth()
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [type, setType] = useState<TransactionType>('egreso')
  const [icon, setIcon] = useState('ShoppingCart')
  const [color, setColor] = useState(colors[0].value)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState<string | null>(null)

  useEffect(() => {
    let active = true
    const loadCategories = async () => {
      if (!user) return
      const { data, error: fetchError } = await fetchUserCategories(user.id)
      if (!active) return
      if (fetchError) {
        setError(`No se pudieron cargar las categorías: ${fetchError.message}`)
      } else {
        setError(null)
        setCategories(data ?? [])
      }
      setLoading(false)
    }
    void loadCategories()
    return () => { active = false }
  }, [user])

  const fetchCategories = async () => {
    if (!user) return
    const { data, error: fetchError } = await fetchUserCategories(user.id)
    if (fetchError) {
      setError(`No se pudieron cargar las categorías: ${fetchError.message}`)
    } else {
      setError(null)
      setCategories(data ?? [])
    }
    setLoading(false)
  }

  const resetForm = () => {
    setName('')
    setType('egreso')
    setIcon('ShoppingCart')
    setColor(colors[0].value)
    setEditingId(null)
  }

  const startEditing = (category: Category) => {
    setName(category.name)
    setType(category.type)
    setIcon(category.icon || 'CircleDollarSign')
    setColor(colors.some((option) => option.value === category.color) ? category.color || colors[0].value : colors[0].value)
    setEditingId(category.id)
    setError(null)
    setSuccess(null)
  }

  const handleSave = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setSuccess(null)
    const trimmedName = name.trim()
    if (!user) {
      setError('Inicia sesión para administrar tus categorías.')
      return
    }
    if (!trimmedName || trimmedName.length > 32) {
      setError('El nombre debe tener entre 1 y 32 caracteres.')
      return
    }
    const duplicate = categories.some((category) =>
      category.id !== editingId
      && category.type === type
      && category.name.normalize('NFC').toLocaleLowerCase('es') === trimmedName.normalize('NFC').toLocaleLowerCase('es'),
    )
    if (duplicate) {
      setError('Ya existe una categoría con ese nombre y tipo.')
      return
    }
    if (editingId) {
      const currentCategory = categories.find((category) => category.id === editingId)
      if (currentCategory?.type !== type) {
        const { count, error: usageError } = await supabase
          .from('transactions')
          .select('id', { count: 'exact', head: true })
          .eq('category_id', editingId)
        if (usageError) {
          setError(`No se pudo verificar el uso de la categoría: ${usageError.message}`)
          return
        }
        if (count) {
          setError('No puedes cambiar el tipo de una categoría que ya tiene movimientos.')
          return
        }
      }
    }

    setSaving(true)
    const result = editingId
      ? await supabase.from('categories').update({ name: trimmedName, type, icon, color }).eq('id', editingId).eq('user_id', user.id)
      : await supabase.from('categories').insert({ user_id: user.id, name: trimmedName, type, icon, color })
    if (result.error) {
      setError(`No se pudo guardar la categoría: ${result.error.message}`)
    } else {
      setSuccess(editingId ? 'Categoría actualizada.' : 'Categoría creada.')
      resetForm()
      await fetchCategories()
    }
    setSaving(false)
  }

  const handleDelete = async (category: Category) => {
    setError(null)
    setSuccess(null)
    if (!user) {
      setError('Inicia sesión para administrar tus categorías.')
      return
    }
    const { count, error: usageError } = await supabase
      .from('transactions')
      .select('id', { count: 'exact', head: true })
      .eq('category_id', category.id)
    if (usageError) {
      setError(`No se pudo verificar el uso de la categoría: ${usageError.message}`)
      return
    }
    if (count) {
      setError('No puedes eliminar una categoría que tiene movimientos asociados.')
      return
    }
    setDeletingId(category.id)
    const { error: deleteError } = await supabase
      .from('categories')
      .delete()
      .eq('id', category.id)
      .eq('user_id', user.id)
    if (deleteError) {
      setError(`No se pudo eliminar la categoría: ${deleteError.message}`)
    } else {
      setSuccess('Categoría eliminada.')
      if (editingId === category.id) resetForm()
      await fetchCategories()
    }
    setDeletingId(null)
  }

  const expenseCategories = categories.filter((category) => category.type === 'egreso')
  const incomeCategories = categories.filter((category) => category.type === 'ingreso')

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <h1 className="text-lg font-bold">Categorías</h1>
        <CollapsibleSection
          key={editingId ?? 'new-category'}
          title={editingId ? 'Editar categoría' : 'Nueva categoría'}
          defaultOpen={Boolean(editingId)}
          className="card-cream p-4"
        >
        <form onSubmit={handleSave} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Nombre
            <input
              value={name}
              onChange={(event) => setName(event.target.value)}
              minLength={1}
              maxLength={32}
              required
              className="rounded-3xl px-3 py-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            />
          </label>
          <div className="grid grid-cols-2 gap-2">
            <label className="flex flex-col gap-1 text-sm">
              Tipo
              <select
                value={type}
                onChange={(event) => setType(event.target.value as TransactionType)}
                className="min-w-0 rounded-3xl px-3 py-2"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                <option value="egreso">Gasto</option>
                <option value="ingreso">Ingreso</option>
              </select>
            </label>
            <label className="flex flex-col gap-1 text-sm">
              Icono
              <select
                value={icon}
                onChange={(event) => setIcon(event.target.value)}
                className="min-w-0 rounded-3xl px-3 py-2"
                style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
              >
                {icons.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
              </select>
            </label>
          </div>
          <label className="flex flex-col gap-1 text-sm">
            Color
            <select
              value={color}
              onChange={(event) => setColor(event.target.value)}
              className="rounded-3xl px-3 py-2"
              style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
            >
              {colors.map((option) => <option key={option.value} value={option.value}>{option.label}</option>)}
            </select>
          </label>
          {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
          {success && <p role="status" className="text-sm text-green-700">{success}</p>}
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="inline-flex flex-1 items-center justify-center gap-2 rounded-3xl py-2 font-semibold disabled:opacity-60" style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}>
              {editingId ? <Check size={16} /> : <Plus size={16} />}
              {saving ? 'Guardando…' : editingId ? 'Guardar cambios' : 'Crear categoría'}
            </button>
            {editingId && <button type="button" onClick={resetForm} aria-label="Cancelar edición" className="rounded-3xl px-3" style={{ background: 'var(--color-surface)' }}><X size={18} /></button>}
          </div>
        </form>
        </CollapsibleSection>

        {loading && <p role="status" className="py-4 text-center text-sm opacity-70">Cargando categorías…</p>}
        {!loading && [
          { title: 'Gastos', items: expenseCategories },
          { title: 'Ingresos', items: incomeCategories },
        ].map((group) => (
          <CollapsibleSection
            key={group.title}
            title={group.title}
            detail={<span className="text-xs opacity-70">{group.items.length}</span>}
            className="card-cream p-4"
            contentClassName="mt-4 flex flex-col gap-2"
          >
            {group.items.length === 0 && <p className="card-cream p-4 text-sm opacity-70">Aún no hay categorías de {group.title.toLowerCase()}.</p>}
            {group.items.map((category) => (
              <div key={category.id} className="card-cream flex min-w-0 items-center gap-3 p-3">
                <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full" style={{ background: category.color || 'var(--color-surface)', color: 'white' }}>
                  <CategoryIcon name={category.icon} categoryName={category.name} />
                </span>
                <span className="min-w-0 flex-1 break-words text-sm font-medium">{category.name}</span>
                <button type="button" onClick={() => startEditing(category)} aria-label={`Editar ${category.name}`} className="shrink-0 rounded-full p-2" style={{ background: 'var(--color-surface)' }}>
                  <Pencil size={16} />
                </button>
                <button type="button" onClick={() => void handleDelete(category)} disabled={deletingId === category.id} aria-label={`Eliminar ${category.name}`} className="shrink-0 rounded-full p-2 disabled:opacity-50" style={{ background: 'var(--color-surface)' }}>
                  <Trash2 size={16} />
                </button>
              </div>
            ))}
          </CollapsibleSection>
        ))}
      </div>
    </Layout>
  )
}
