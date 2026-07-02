'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Download, TrendingUp, TrendingDown, Wallet, PieChart, Loader2, Calculator } from 'lucide-react'
import type { AccountingData, CashClose } from '@/actions/accounting'
import { getAccountingData, getCashClose } from '@/actions/accounting'
import { serviceLabel } from '@/lib/constants/services'
import { paymentMethodLabel } from '@/lib/constants/finance'
import { formatCLP } from '@/lib/date'
import { ExpensesManager } from '@/components/admin/ExpensesManager'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

function csvEscape(v: string | number): string {
  const s = String(v)
  return /[",\n;]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
}

function downloadCsv(data: AccountingData) {
  const rows: (string | number)[][] = []
  rows.push(['Cuatro Huellas — Contabilidad', data.month])
  rows.push([])
  rows.push(['Resumen'])
  rows.push(['Ingresos', data.incomeTotal])
  rows.push(['Gastos', data.expenseTotal])
  rows.push(['Utilidad', data.profit])
  rows.push([])
  rows.push(['INGRESOS'])
  rows.push(['Tipo', 'Fecha', 'Detalle', 'Servicio/Categoría', 'Método de pago', 'Monto'])
  for (const a of data.appointments) {
    rows.push(['Servicio', a.appointment_date, `${a.pet_name} (${a.owner_name})`, serviceLabel(a.service), paymentMethodLabel(a.payment_method), Number(a.price_charged) || 0])
  }
  for (const m of data.manuals) {
    rows.push(['Otro ingreso', m.income_date, m.description ?? '', 'Otros ingresos', paymentMethodLabel(m.payment_method), Number(m.amount) || 0])
  }
  rows.push([])
  rows.push(['GASTOS'])
  rows.push(['Fecha', 'Categoría', 'Detalle', 'Método de pago', 'Monto'])
  for (const e of data.expenses) {
    rows.push([e.expense_date, e.category, e.description ?? '', paymentMethodLabel(e.payment_method), Number(e.amount) || 0])
  }

  const csv = '﻿' + rows.map((r) => r.map(csvEscape).join(';')).join('\r\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `contabilidad-cuatro-huellas-${data.month}.csv`
  link.click()
  URL.revokeObjectURL(url)
}

function Breakdown({ title, icon: Icon, rows }: { title: string; icon: typeof PieChart; rows: { label: string; total: number }[] }) {
  const max = Math.max(1, ...rows.map((r) => r.total))
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
                <span className="font-semibold">{formatCLP(r.total)}</span>
              </div>
              <div className="h-1.5 rounded-full bg-secondary overflow-hidden">
                <div className="h-full rounded-full gradient-warm" style={{ width: `${(r.total / max) * 100}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function AccountingManager({
  initialData,
  initialCashClose,
}: {
  initialData: AccountingData
  initialCashClose: CashClose
}) {
  const router = useRouter()
  const [month, setMonth] = useState(initialData.month)
  const [data, setData] = useState<AccountingData>(initialData)
  const [loading, setLoading] = useState(false)
  const [cashDate, setCashDate] = useState(initialCashClose.date)
  const [cash, setCash] = useState<CashClose>(initialCashClose)
  const [, startTransition] = useTransition()

  async function reload(m: string) {
    setLoading(true)
    setData(await getAccountingData(m))
    setLoading(false)
    router.refresh()
  }

  function changeCashDate(d: string) {
    setCashDate(d)
    startTransition(async () => setCash(await getCashClose(d)))
  }

  return (
    <div>
      {/* Controles */}
      <div className="flex items-center justify-between gap-3 flex-wrap mb-6">
        <input
          type="month"
          value={month}
          max={currentMonth()}
          onChange={(e) => { setMonth(e.target.value); reload(e.target.value) }}
          className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none"
        />
        <button
          onClick={() => downloadCsv(data)}
          className="inline-flex items-center gap-2 h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/60 transition-all"
        >
          <Download className="size-4" /> Exportar a Excel
        </button>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5"><TrendingUp className="size-3.5 text-green-600" /> Ingresos</p>
          <p className="text-3xl font-black text-green-600">{loading ? '…' : formatCLP(data.incomeTotal)}</p>
        </div>
        <div className="p-6 rounded-2xl border border-border bg-card">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5"><TrendingDown className="size-3.5 text-destructive" /> Gastos</p>
          <p className="text-3xl font-black text-destructive">{loading ? '…' : formatCLP(data.expenseTotal)}</p>
        </div>
        <div className="p-6 rounded-2xl border-2 border-primary/30 bg-primary/5">
          <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2 flex items-center gap-1.5"><Wallet className="size-3.5 text-primary" /> Utilidad</p>
          <p className={`text-3xl font-black ${data.profit >= 0 ? 'text-primary' : 'text-destructive'}`}>{loading ? '…' : formatCLP(data.profit)}</p>
        </div>
      </div>

      {/* Desgloses */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-10">
        <Breakdown title="Ingresos por método" icon={Wallet} rows={data.incomeByMethod.map((r) => ({ label: r.method, total: r.total }))} />
        <Breakdown title="Ingresos por servicio" icon={PieChart} rows={data.incomeByService.map((r) => ({ label: r.service, total: r.total }))} />
        <Breakdown title="Gastos por categoría" icon={TrendingDown} rows={data.expenseByCategory.map((r) => ({ label: r.category, total: r.total }))} />
      </div>

      {/* Cierre de caja diario */}
      <div className="p-5 rounded-2xl border border-border bg-card mb-10">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-4 flex items-center gap-2">
          <Calculator className="size-4" /> Cierre de caja
        </h2>
        <input
          type="date"
          value={cashDate}
          onChange={(e) => changeCashDate(e.target.value)}
          className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none mb-4"
        />
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <p className="text-xs text-muted-foreground uppercase tracking-wide font-semibold mb-2">Ingresos del día por método</p>
            {cash.byMethod.length === 0 ? (
              <p className="text-sm text-muted-foreground">Sin ingresos este día.</p>
            ) : (
              <div className="space-y-1.5">
                {cash.byMethod.map((m) => (
                  <div key={m.method} className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">{m.method}</span>
                    <span className="font-semibold">{formatCLP(m.total)}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
          <div className="sm:border-l sm:border-border sm:pl-4 space-y-1.5 text-sm">
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Total ingresos</span><span className="font-semibold text-green-600">{formatCLP(cash.incomeTotal)}</span></div>
            <div className="flex items-center justify-between"><span className="text-muted-foreground">Total gastos</span><span className="font-semibold text-destructive">−{formatCLP(cash.expenseTotal)}</span></div>
            <div className="flex items-center justify-between pt-1.5 border-t border-border"><span className="font-bold">Neto del día</span><span className={`font-black ${cash.net >= 0 ? 'text-primary' : 'text-destructive'}`}>{formatCLP(cash.net)}</span></div>
          </div>
        </div>
      </div>

      {/* Gastos del mes */}
      <ExpensesManager month={month} expenses={data.expenses} onChanged={() => reload(month)} />
    </div>
  )
}
