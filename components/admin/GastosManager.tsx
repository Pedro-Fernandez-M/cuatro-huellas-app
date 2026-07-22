'use client'

import { useState, useTransition } from 'react'
import { Loader2, PieChart } from 'lucide-react'
import type { Expense } from '@/types'
import { listExpenses } from '@/actions/expenses'
import { formatCLP } from '@/lib/date'
import { MonthPicker } from '@/components/admin/DayPicker'
import { ExpensesManager } from '@/components/admin/ExpensesManager'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default function GastosManager({ initialMonth, initialExpenses }: { initialMonth: string; initialExpenses: Expense[] }) {
  const [month, setMonth] = useState(initialMonth)
  const [expenses, setExpenses] = useState(initialExpenses)
  const [isPending, startTransition] = useTransition()

  function reload(m: string) {
    startTransition(async () => setExpenses(await listExpenses(m)))
  }

  function changeMonth(m: string) {
    setMonth(m)
    reload(m)
  }

  const total = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  // Desglose por categoría
  const catMap = new Map<string, number>()
  for (const e of expenses) catMap.set(e.category, (catMap.get(e.category) ?? 0) + (Number(e.amount) || 0))
  const byCategory = Array.from(catMap.entries()).map(([label, value]) => ({ label, value })).sort((a, b) => b.value - a.value)
  const maxCat = Math.max(1, ...byCategory.map((c) => c.value))

  return (
    <div>
      {/* Controles arriba */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <MonthPicker value={month} max={currentMonth()} basePath="/admin/dashboard/gastos" />
          {isPending && <Loader2 className="size-4 animate-spin text-primary" />}
        </div>
        <div className="text-right">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold">Total del mes</p>
          <p className="text-2xl font-black text-destructive">{formatCLP(total)}</p>
        </div>
      </div>

      {/* Ingreso de datos arriba + lista */}
      <ExpensesManager month={month} expenses={expenses} onChanged={() => reload(month)} />

      {/* Gráfico por categoría abajo */}
      {byCategory.length > 0 && (
        <div className="mt-8 p-4 rounded-2xl border border-border bg-card">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <PieChart className="size-3.5" /> Gastos por categoría
          </h3>
          <div className="space-y-2">
            {byCategory.map((c) => (
              <div key={c.label}>
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-muted-foreground">{c.label}</span>
                  <span className="font-semibold">{formatCLP(c.value)}</span>
                </div>
                <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                  <div className="h-full rounded-full bg-destructive/70" style={{ width: `${(c.value / maxCat) * 100}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
