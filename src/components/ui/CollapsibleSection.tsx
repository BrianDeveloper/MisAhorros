import type { ReactNode } from 'react'
import { ChevronDown } from 'lucide-react'

interface CollapsibleSectionProps {
  title: string
  children: ReactNode
  icon?: ReactNode
  detail?: ReactNode
  defaultOpen?: boolean
  className?: string
  contentClassName?: string
}

export function CollapsibleSection({
  title,
  children,
  icon,
  detail,
  defaultOpen = false,
  className = 'card-cream p-4',
  contentClassName = 'mt-4 flex flex-col gap-3',
}: CollapsibleSectionProps) {
  return (
    <details className={`group ${className}`} open={defaultOpen}>
      <summary className="flex cursor-pointer list-none items-center gap-2 marker:content-none [&::-webkit-details-marker]:hidden">
        {icon}
        <span className="min-w-0 flex-1 font-semibold">{title}</span>
        {detail}
        <ChevronDown aria-hidden="true" size={18} className="shrink-0 transition-transform group-open:rotate-180" />
      </summary>
      <div className={contentClassName}>{children}</div>
    </details>
  )
}
