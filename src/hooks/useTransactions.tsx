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

  const fetchProfile = useCallback(async () => {
    if (!user) {
      setProfile(null)
      setLoading(false)
      return
    }
    setLoading(true)
    const { data } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle()
    setProfile(data)
    setLoading(false)
  }, [user])

  const updateBalance = async (newBalance: number) => {
    if (!user) return
    await supabase.from('profiles').update({ balance_actual: newBalance }).eq('user_id', user.id)
    await fetchProfile()
  }

  useEffect(() => {
    fetchProfile()
  }, [fetchProfile])

  return { profile, balance: profile?.balance_actual ?? 0, loading, fetchProfile, updateBalance }
}

export function useTransactions() {
  const { user } = useAuth()
  const [transactions, setTransactions] = useState<(Transaction & { categories: Category | null })[]>([])
  const [categories, setCategories] = useState<Category[]>([])
  const [loading, setLoading] = useState(true)

  const fetchAll = useCallback(async () => {
    if (!user) {
      setTransactions([])
      setCategories([])
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
    const { error } = await supabase.from('transactions').insert({
      user_id: user.id,
      ...input,
    })
    if (error) throw error
    await fetchAll()
  }

  const deleteTransaction = async (id: string) => {
    if (!user) return
    await supabase.from('transactions').delete().eq('id', id).eq('user_id', user.id)
    await fetchAll()
  }

  useEffect(() => {
    fetchAll()
  }, [fetchAll])

  return { transactions, categories, loading, fetchAll, addTransaction, deleteTransaction }
}
