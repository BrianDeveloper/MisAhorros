import type { ReactNode } from 'react'

interface SettingSwitchProps {
  id: string
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  description?: ReactNode
}

export function SettingSwitch({ id, checked, onChange, label, description }: SettingSwitchProps) {
  return (
    <label htmlFor={id} className="flex cursor-pointer items-center justify-between gap-4 text-sm">
      <span className="min-w-0">
        <span className="block font-medium">{label}</span>
        {description && <span className="mt-0.5 block text-xs opacity-70">{description}</span>}
      </span>
      <span className="relative flex h-7 w-12 shrink-0 items-center">
        <input
          id={id}
          type="checkbox"
          role="switch"
          checked={checked}
          onChange={(event) => onChange(event.target.checked)}
          className="peer absolute inset-0 z-10 m-0 h-full w-full cursor-pointer opacity-0"
        />
        <span
          aria-hidden="true"
          className="absolute inset-0 rounded-full border transition-colors peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2"
          style={{
            background: checked ? 'var(--color-primary)' : 'var(--color-surface)',
            borderColor: checked ? 'var(--color-primary)' : 'var(--color-border)',
            outlineColor: 'var(--color-primary)',
          }}
        />
        <span
          aria-hidden="true"
          className="relative ml-1 h-5 w-5 rounded-full shadow transition-transform peer-checked:translate-x-5"
          style={{ background: 'var(--color-card)' }}
        />
      </span>
    </label>
  )
}
