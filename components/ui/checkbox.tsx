'use client'

import * as React from 'react'
import { Check } from 'lucide-react'
import { cn } from '@/lib/utils'

interface CheckboxProps {
  checked: boolean
  onChange: (checked: boolean) => void
  label: string
  className?: string
}

export function Checkbox({ checked, onChange, label, className }: CheckboxProps) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={cn(
        'flex items-center gap-3 text-left p-3.5 rounded-xl border transition-all w-full',
        checked ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/40',
        className
      )}
    >
      <span
        className={cn(
          'size-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-colors',
          checked ? 'bg-primary border-primary text-primary-foreground' : 'border-border'
        )}
      >
        {checked && <Check className="size-4" />}
      </span>
      <span className="text-base font-semibold leading-snug">{label}</span>
    </button>
  )
}
