import { useState } from 'react'
import { Layout } from '@/components/layout/Layout'
import { useSavings } from '@/hooks/useSavings'
import { NewGoalModal } from '@/components/savings/NewGoalModal'
import { GoalContributionModal } from '@/components/savings/GoalContributionModal'
import { Plus, ArrowDownCircle, ArrowUpCircle } from 'lucide-react'
import * as Icons from 'lucide-react'

export default function Savings() {
  const { goals, loading } = useSavings()
  const [openNew, setOpenNew] = useState(false)
  const [openContrib, setOpenContrib] = useState(false)
  const [selected, setSelected] = useState<any>(null)
  const [mode, setMode] = useState<'abonar' | 'retirar'>('abonar')

  const getIcon = (name?: string) => {
    const Icon = name && (Icons as any)[name] ? (Icons as any)[name] : Icons.PiggyBank
    return <Icon size={20} />
  }

  return (
    <Layout>
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold">Metas de ahorro</h1>
          <button
            onClick={() => setOpenNew(true)}
            className="rounded-3xl px-3 py-2 text-sm flex items-center gap-2"
            style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
          >
            <Plus size={16} /> Nueva meta
          </button>
        </div>

        {loading && <p className="text-sm opacity-70">Cargando...</p>}
        {goals.length === 0 && !loading && (
          <div className="card-cream p-6 text-center">
            <p className="font-semibold mb-1">Aún no tienes metas</p>
            <p className="text-sm opacity-70">Crea tu primera alcancía para ahorrar con alegría</p>
          </div>
        )}

        {goals.map((goal) => {
          const current = Number(goal.current_amount)
          const target = Number(goal.target_amount)
          const progress = Math.min(100, target === 0 ? 0 : (current / target) * 100)
          const done = progress >= 100
          return (
            <div key={goal.id} className="card-cream p-4 flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div
                    className="h-10 w-10 rounded-full flex items-center justify-center"
                    style={{ background: done ? 'var(--color-primary)' : 'var(--color-surface)', color: 'var(--color-primary-foreground)', border: '1px solid var(--color-border)' }}
                  >
                    {getIcon(goal.icon)}
                  </div>
                  <div>
                    <p className="font-semibold">{goal.title}</p>
                    <p className="text-xs opacity-70">
                      ${current.toFixed(2)} / ${target.toFixed(2)}
                    </p>
                  </div>
                </div>
                <span className="text-sm font-semibold">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 rounded-full overflow-hidden" style={{ background: 'var(--color-surface)' }}>
                <div className="h-full" style={{ width: `${progress}%`, background: done ? 'var(--color-primary)' : 'var(--color-accent)' }} />
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setSelected(goal)
                    setMode('abonar')
                    setOpenContrib(true)
                  }}
                  className="flex-1 rounded-3xl py-2 text-sm flex items-center justify-center gap-2"
                  style={{ background: 'var(--color-primary)', color: 'var(--color-primary-foreground)' }}
                >
                  <ArrowDownCircle size={16} /> Abonar
                </button>
                <button
                  onClick={() => {
                    setSelected(goal)
                    setMode('retirar')
                    setOpenContrib(true)
                  }}
                  className="flex-1 rounded-3xl py-2 text-sm flex items-center justify-center gap-2"
                  style={{ background: 'var(--color-surface)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                >
                  <ArrowUpCircle size={16} /> Retirar
                </button>
              </div>
            </div>
          )
        })}
      </div>
      <NewGoalModal open={openNew} onClose={() => setOpenNew(false)} />
      <GoalContributionModal open={openContrib} onClose={() => setOpenContrib(false)} goal={selected} mode={mode} />
    </Layout>
  )
}
