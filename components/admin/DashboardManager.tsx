'use client'

import { useState, useTransition } from 'react'
import Link from 'next/link'
import {
  Printer, PawPrint, TrendingUp, Wallet, Users, UserPlus, Star,
  CalendarDays, AlertTriangle, Scissors, Dog, Loader2,
} from 'lucide-react'
import type { DashboardData } from '@/actions/dashboard'
import { getDashboardData } from '@/actions/dashboard'
import { formatCLP } from '@/lib/date'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function Kpi({ label, value, hint, icon: Icon, accent }: {
  label: string; value: string | number; hint?: string
  icon: React.ComponentType<{ className?: string }>; accent?: boolean
}) {
  return (
    <div className={`p-5 rounded-2xl border bg-card ${accent ? 'border-primary/30 bg-primary/5' : 'border-border'}`}>
      <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5">
        <Icon className="size-3.5 text-primary" /> {label}
      </p>
      <p className="text-2xl font-black text-foreground">{value}</p>
      {hint && <p className="text-xs text-muted-foreground mt-1">{hint}</p>}
    </div>
  )
}

function BarList({ title, icon: Icon, rows, unit = '' }: {
  title: string; icon: React.ComponentType<{ className?: string }>
  rows: { label: string; value: number }[]; unit?: string
}) {
  const max = Math.max(1, ...rows.map((r) => r.value))
  return (
    <div className="p-4 rounded-2xl border border-border bg-card">
      <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
        <Icon className="size-3.5" /> {title}
      </h3>
      {rows.length === 0 ? (
        <p className="text-xs text-muted-foreground">Sin datos.</p>
      ) : (
        <div className="space-y-2">
          {rows.map((r) => (
            <div key={r.label}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-muted-foreground">{r.label}</span>
                <span className="font-semibold">{r.value}{unit}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full gradient-warm" style={{ width: `${(r.value / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function DashboardManager({ initial }: { initial: DashboardData }) {
  const [month, setMonth] = useState(initial.month)
  const [data, setData] = useState(initial)
  const [isPending, startTransition] = useTransition()

  function changeMonth(m: string) {
    setMonth(m)
    startTransition(async () => setData(await getDashboardData(m)))
  }

  const bestDay = [...data.perDay].sort((a, b) => b.visits - a.visits)[0]

  return (
    <div>
      {/* Controles */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <div className="flex items-center gap-2">
          <input
            type="month"
            value={month}
            max={currentMonth()}
            onChange={(e) => changeMonth(e.target.value)}
            className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none"
          />
          {isPending && <Loader2 className="size-4 animate-spin text-primary" />}
        </div>
        <Link
          href={`/admin/dashboard/informe?mes=${month}`}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl gradient-warm text-primary-foreground text-sm font-bold hover:opacity-90 transition-all"
        >
          <Printer className="size-4" /> Imprimir informe
        </Link>
      </div>

      {/* KPIs del mes */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <Kpi label="Atenciones" value={data.visits} hint={`${data.noShows} no llegaron · ${data.cancelled} canceladas`} icon={PawPrint} />
        <Kpi label="Ingresos netos" value={formatCLP(data.income)} hint="después de comisiones" icon={TrendingUp} />
        <Kpi label="Gastos" value={formatCLP(data.expenses)} icon={Wallet} />
        <Kpi label="Utilidad" value={formatCLP(data.profit)} accent icon={Wallet} />
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <Kpi label="Ticket promedio" value={formatCLP(data.avgTicket)} icon={Star} />
        <Kpi label="Esta semana" value={data.weekVisits} hint={`${formatCLP(data.weekIncome)} facturado`} icon={CalendarDays} />
        <Kpi label="Clientes nuevos" value={data.newClients} hint="en el mes" icon={UserPlus} />
        <Kpi label="Clientes totales" value={data.totalClients} icon={Users} />
      </div>

      {/* Distribuciones */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <BarList title="Atenciones por día de la semana" icon={CalendarDays} rows={data.byWeekday.map((d) => ({ label: d.day, value: d.visits }))} />
        <BarList title="Servicios más pedidos" icon={Scissors} rows={data.byService.map((s) => ({ label: s.label, value: s.visits }))} />
        <BarList title="Por tamaño de mascota" icon={Dog} rows={data.bySize.map((s) => ({ label: s.label, value: s.visits }))} />
      </div>

      {bestDay && (
        <div className="p-4 rounded-2xl border border-primary/30 bg-primary/5 mb-8 text-sm">
          <span className="font-semibold text-primary">Día con más atenciones del mes:</span>{' '}
          {bestDay.date} con <strong>{bestDay.visits}</strong> atenciones ({formatCLP(bestDay.income)}).
        </div>
      )}

      {/* Clientes frecuentes + stock bajo */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 rounded-2xl border border-border bg-card">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <Star className="size-3.5" /> Clientes frecuentes (histórico)
          </h3>
          {data.frequentClients.length === 0 ? (
            <p className="text-xs text-muted-foreground">Aún no hay suficientes visitas.</p>
          ) : (
            <div className="space-y-2">
              {data.frequentClients.map((c) => (
                <div key={c.phone} className="flex items-center justify-between text-sm">
                  <div>
                    <p className="font-medium">{c.name}</p>
                    <p className="text-xs text-muted-foreground">{c.phone}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-primary">{c.visits} visitas</p>
                    <p className="text-xs text-muted-foreground">{formatCLP(c.total)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="p-4 rounded-2xl border border-border bg-card">
          <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wide mb-3 flex items-center gap-1.5">
            <AlertTriangle className="size-3.5" /> Productos con poco stock
          </h3>
          {data.lowStock.length === 0 ? (
            <p className="text-xs text-muted-foreground">Todo el inventario está bien. 👍</p>
          ) : (
            <div className="space-y-2">
              {data.lowStock.map((p) => (
                <div key={p.name} className="flex items-center justify-between text-sm">
                  <span>{p.name}</span>
                  <span className="font-semibold text-destructive">{p.stock} {p.unit}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
