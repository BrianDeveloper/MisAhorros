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
    if (!user) throw new Error('No user')
    const { error } = await supabase.from('savings_goals').insert({
      user_id: user.id,
      title: input.title,
      target_amount: input.target_amount,
      current_amount: 0,
      icon: input.icon,
      status: 'en_progreso',
    })
    if (error) throw error
    await fetchGoals()
  }

  const contribute = async (goalId: string, amount: number, note?: string) => {
    if (!user) throw new Error('No user')
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) throw new Error('Goal not found')
    const newAmount = Number(goal.current_amount) + amount
    const status = newAmount >= Number(goal.target_amount) ? 'completado' : 'en_progreso'
    await supabase.from('savings_goals').update({ current_amount: newAmount, status }).eq('id', goalId).eq('user_id', user.id)
    await supabase.from('savings_contributions').insert({
      user_id: user.id,
      goal_id: goalId,
      amount,
      note: note || null,
    })
    await fetchGoals()
  }

  const withdraw = async (goalId: string, amount: number, note?: string) => {
    if (!user) throw new Error('No user')
    const goal = goals.find((g) => g.id === goalId)
    if (!goal) throw new Error('Goal not found')
    const current = Number(goal.current_amount)
    if (amount > current) throw new Error('Insufficient')
    const newAmount = current - amount
    const status = newAmount >= Number(goal.target_amount) ? 'completado' : 'en_progreso'
    await supabase.from('savings_goals').update({ current_amount: newAmount, status }).eq('id', goalId).eq('user_id', user.id)
    await supabase.from('savings_contributions').insert({
      user_id: user.id,
      goal_id: goalId,
      amount: -amount,
      note: note || 'retiro',
    })
    await fetchGoals()
  }

  useEffect(() => {
    fetchGoals()
  }, [fetchGoals])

  return { goals, contributions, loading, fetchGoals, createGoal, contribute, withdraw }
}
