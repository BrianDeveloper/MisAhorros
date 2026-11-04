import { useEffect, useState, useCallback } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import type { Database } from '@/types/database'

type Profile = Database['public']['Tables']['profiles']['Row']
type Transaction = Database['public']['Tables']['transactions']['Row']
type Category = Database['public']['Tables']['categories']['Row']

export function useWallet() {
  const { user } = useAuth()
  const [profile, setProfile] = useState<Profile | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    if (fetchError) {
      setError(fetchError.message)
      setLoading(false)
      return
    }
    setError(null)
    setProfile(data)
    setLoading(false)
  }, [user])

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, balance: profile?.balance_actual ?? 0, loading, error, fetchProfile }
}

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<(Transaction & { categories: Category | null })[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchAll = useCallback(async () => {
    if (!user) {
      setTransactions([])
      setCategories([])
      setError(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const [txRes, catRes] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(*)')
        .eq('user_id', user.id)
        .order('date', { ascending: false })
        .order('created_at', { ascending: false }),
      supabase.from('categories').select('*').eq('user_id', user.id).order('name'),
    ])
    if (txRes.error || catRes.error) {
      setError(txRes.error?.message || catRes.error?.message || 'No se pudieron cargar los datos.')
      setLoading(false)
      return
    }
    setError(null)
    setTransactions((txRes.data as any) || [])
    setCategories(catRes.data || [])
    setLoading(false)
  }, [user])

  const addTransaction = async (input: {
    type: 'ingreso' | 'egreso'
    amount: number
    category_id: string | null
    description: string | null
    date: string
  }) => {
    if (!user) throw new Error('No user')
    const { error } = await supabase.rpc('create_transaction', {
      p_type: input.type,
      p_amount: input.amount,
      p_category_id: input.category_id,
      p_description: input.description,
      p_date: input.date,
    })
    if (error) throw error
    await fetchAll()
  }

  const deleteTransaction = async (id: string) => {
    if (!user) return
    const { error } = await supabase.rpc('delete_transaction', { p_transaction_id: id })
    if (error) throw error
    await fetchAll()
  }

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { transactions, categories, loading, error, fetchAll, addTransaction, deleteTransaction }
}
