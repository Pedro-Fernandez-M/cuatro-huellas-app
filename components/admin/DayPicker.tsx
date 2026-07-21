'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

/**
 * Selector de día que navega solo al cambiar la fecha (sin botón "Ver día").
 */
export function DayPicker({ value, param = 'dia', basePath }: { value: string; param?: string; basePath: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <input
        type="date"
        value={value}
        onChange={(e) => {
          const v = e.target.value
          if (!v) return
          startTransition(() => router.push(`${basePath}?${param}=${v}`))
        }}
        className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none"
      />
      {isPending && <Loader2 className="size-4 animate-spin text-primary" />}
    </div>
  )
}

/** Igual que DayPicker pero para meses (input type="month"). */
export function MonthPicker({ value, param = 'mes', basePath, max }: { value: string; param?: string; basePath: string; max?: string }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  return (
    <div className="flex items-center gap-2">
      <input
        type="month"
        value={value}
        max={max}
        onChange={(e) => {
          const v = e.target.value
          if (!v) return
          startTransition(() => router.push(`${basePath}?${param}=${v}`))
        }}
        className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none"
      />
      {isPending && <Loader2 className="size-4 animate-spin text-primary" />}
    </div>
  )
}
