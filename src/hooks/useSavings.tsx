import { useCallback, useEffect, useState } from 'react'
import { supabase } from '@/lib/supabaseClient'
import { useAuth } from '@/context/AuthContext'
import type { Database } from '@/types/database'

type SavingsGoal = Database['public']['Tables']['savings_goals']['Row']
type SavingsContribution = Database['public']['Tables']['savings_contributions']['Row']

export function useSavings() {
  const { user } = useAuth()
  const [goals, setGoals] = useState<SavingsGoal[]>([])
  const [contributions, setContributions] = useState<SavingsContribution[]>([])
  const [loading, setLoading] = useState(true)

  const fetchGoals = useCallback(async () => {
    if (!user) {
      setGoals([])
      setContributions([])
      setLoading(false)
      return
    }
    setLoading(true)
    const [goalsRes, contribRes] = await Promise.all([
      supabase.from('savings_goals').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
      supabase.from('savings_contributions').select('*').eq('user_id', user.id).order('created_at', { ascending: false }),
    ])
    setGoals(goalsRes.data || [])
    setContributions(contribRes.data || [])
    setLoading(false)
  }, [user])

  const createGoal = async (input: { title: string; target_amount: number; icon: string }) => {
    const { error } = await supabase.rpc('create_savings_goal', {
      p_title: input.title,
      p_target_amount: input.target_amount,
      p_icon: input.icon,
    })
    if (error) throw error
    await fetchGoals()
  }

  const contribute = async (goalId: string, amount: number, note?: string) => {
    const { error } = await supabase.rpc('save_goal_contribution', {
      p_goal_id: goalId,
      p_amount: amount,
      p_note: note || null,
      p_is_withdrawal: false,
    })
    if (error) throw error
    await fetchGoals()
  }

  const withdraw = async (goalId: string, amount: number, note?: string) => {
    const { error } = await supabase.rpc('save_goal_contribution', {
      p_goal_id: goalId,
      p_amount: amount,
      p_note: note || 'retiro',
      p_is_withdrawal: true,
    })
    if (error) throw error
    await fetchGoals()
  }

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return { goals, contributions, loading, fetchGoals, createGoal, contribute, withdraw }
}
