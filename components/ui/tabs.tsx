'use client'

import { cn } from '@/lib/utils'

export interface TabItem {
  id: string
  label: string
  icon?: React.ComponentType<{ className?: string }>
}

export function Tabs({
  tabs,
  active,
  onChange,
  className,
}: {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
  className?: string
}) {
  return (
    <div className={cn('flex gap-1 border-b border-border overflow-x-auto', className)}>
      {tabs.map((t) => {
        const Icon = t.icon
        const isActive = t.id === active
        return (
          <button
            key={t.id}
            onClick={() => onChange(t.id)}
            className={cn(
              'inline-flex items-center gap-1.5 px-4 py-2.5 text-sm font-semibold whitespace-nowrap transition-colors border-b-2 -mb-px',
              isActive
                ? 'border-primary text-primary'
                : 'border-transparent text-muted-foreground hover:text-foreground'
            )}
          >
            {Icon && <Icon className="size-4" />}
            {t.label}
          </button>
        )
      })}
    </div>
  )
}
