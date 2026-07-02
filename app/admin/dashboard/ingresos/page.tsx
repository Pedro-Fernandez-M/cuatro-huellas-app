import { TrendingUp } from 'lucide-react'
import { getIncomeSummary, getMonthIncome } from '@/actions/income'
import { formatCLP } from '@/lib/date'
import IncomeManager from '@/components/admin/IncomeManager'

export const dynamic = 'force-dynamic'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function IngresosPage() {
  const month = currentMonth()
  const [summary, monthData] = await Promise.all([getIncomeSummary(), getMonthIncome(month)])
  const maxWeekTotal = Math.max(1, ...summary.last8Weeks.map((w) => w.total))

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Ingresos</h1>
      <p className="text-sm text-muted-foreground mb-8">Visitas cobradas + otros ingresos. Puedes editar, agregar o eliminar registros.</p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Esta semana</p>
          <p className="text-3xl font-black text-primary mb-1">{formatCLP(summary.weekTotal)}</p>
          <p className="text-xs text-muted-foreground">{summary.weekCount} visitas completadas</p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Este mes</p>
          <p className="text-3xl font-black text-primary mb-1">{formatCLP(summary.monthTotal)}</p>
          <p className="text-xs text-muted-foreground">{summary.monthCount} visitas completadas</p>
        </div>
      </div>

      {summary.last8Weeks.length > 0 && (
        <>
          <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
            <TrendingUp className="size-4" /> Últimas 8 semanas
          </h2>
          <div className="flex items-end gap-3 h-40 p-4 rounded-2xl border border-border bg-card mb-10">
            {summary.last8Weeks.map((w) => (
              <div key={w.weekStart} className="flex-1 flex flex-col items-center justify-end gap-2 h-full">
                <div
                  className="w-full rounded-t-md gradient-warm"
                  style={{ height: `${Math.max(4, (w.total / maxWeekTotal) * 100)}%` }}
                  title={formatCLP(w.total)}
                />
                <span className="text-[10px] text-muted-foreground">{w.weekStart.slice(5)}</span>
              </div>
            ))}
          </div>
        </>
      )}

      <h2 className="text-lg font-bold mb-4">Detalle por mes</h2>
      <IncomeManager initialMonth={month} initialData={monthData} />
    </div>
  )
}
