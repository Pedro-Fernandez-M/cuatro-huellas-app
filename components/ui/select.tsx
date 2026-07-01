import * as React from 'react'
import { cn } from '@/lib/utils'

export function Select({ className, ...props }: React.SelectHTMLAttributes<HTMLSelectElement>) {
  return (
    <select
      className={cn(
        'w-full h-11 px-3.5 rounded-xl border border-border bg-input/60 text-foreground focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition-all',
        className
      )}
      {...props}
    />
  )
}
