import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'
import { getDashboardData } from '@/actions/dashboard'
import { getAccountingData } from '@/actions/accounting'
import { listProducts } from '@/actions/inventory'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { paymentMethodLabel } from '@/lib/constants/finance'
import { formatCLP, formatDateLong } from '@/lib/date'
import { PrintButton } from '@/components/admin/PrintButton'

export const dynamic = 'force-dynamic'

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

const MONTH_NAMES = ['Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio', 'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre']

function monthTitle(month: string) {
  const [y, m] = month.split('-').map(Number)
  return `${MONTH_NAMES[m - 1]} ${y}`
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="mb-8 break-inside-avoid">
      <h2 className="text-sm font-black uppercase tracking-wide border-b-2 border-primary/40 pb-1 mb-3">{title}</h2>
      {children}
    </section>
  )
}

function Row({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className={`flex items-center justify-between py-1 text-sm ${strong ? 'font-bold border-t border-border mt-1 pt-1.5' : ''}`}>
      <span className={strong ? '' : 'text-muted-foreground'}>{label}</span>
      <span>{value}</span>
    </div>
  )
}

export default async function InformePage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const month = /^\d{4}-\d{2}$/.test(mes ?? '') ? mes! : currentMonth()

  const [dash, acc, products] = await Promise.all([
    getDashboardData(month),
    getAccountingData(month),
    listProducts(),
  ])

  return (
    <div className="max-w-4xl print-area">
      {/* Barra superior — no se imprime */}
      <div className="no-print flex items-center justify-between gap-3 flex-wrap mb-6">
        <Link href="/admin/dashboard/resumen" className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors">
          <ChevronLeft className="size-4" /> Volver
        </Link>
        <form className="flex items-center gap-2">
          <input
            type="month"
            name="mes"
            defaultValue={month}
            max={currentMonth()}
            className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none"
          />
          <button className="h-10 px-4 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/60 transition-all">
            Ver mes
          </button>
        </form>
        <PrintButton />
      </div>

      {/* ── Encabezado del informe ── */}
      <header className="mb-8 pb-4 border-b-2 border-primary">
        <h1 className="text-2xl font-black tracking-tight">Cuatro Huellas — Informe mensual</h1>
        <p className="text-sm text-muted-foreground">
          {monthTitle(month)} · Peluquería canina · Rubén Darío 146, Valdivia
        </p>
        <p className="text-xs text-muted-foreground mt-1">
          Generado el {formatDateLong(new Date().toISOString().slice(0, 10))}
        </p>
      </header>

      {/* ── Resumen ejecutivo ── */}
      <Section title="Resumen del mes">
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { l: 'Atenciones', v: String(dash.visits) },
            { l: 'Ingresos netos', v: formatCLP(dash.income) },
            { l: 'Gastos', v: formatCLP(dash.expenses) },
            { l: 'Utilidad', v: formatCLP(dash.profit) },
            { l: 'Ticket promedio', v: formatCLP(dash.avgTicket) },
            { l: 'Clientes nuevos', v: String(dash.newClients) },
            { l: 'No llegaron', v: String(dash.noShows) },
            { l: 'Canceladas', v: String(dash.cancelled) },
          ].map((k) => (
            <div key={k.l} className="p-3 rounded-xl border border-border">
              <p className="text-[10px] text-muted-foreground uppercase tracking-wide font-semibold">{k.l}</p>
              <p className="text-lg font-black">{k.v}</p>
            </div>
          ))}
        </div>
      </Section>

      {/* ── Finanzas ── */}
      <Section title="Detalle financiero">
        <Row label="Ingresos brutos (servicios + otros)" value={formatCLP(acc.incomeTotal)} />
        <Row label="Comisiones de tarjeta" value={`− ${formatCLP(acc.commissionTotal)}`} />
        <Row label="Ingresos netos recibidos" value={formatCLP(acc.netIncomeTotal)} />
        <Row label="Gastos del mes" value={`− ${formatCLP(acc.expenseTotal)}`} />
        <Row label="UTILIDAD DEL MES" value={formatCLP(acc.profit)} strong />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mt-5">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Ingresos por método de pago</h3>
            {acc.incomeByMethod.length === 0 ? <p className="text-xs text-muted-foreground">Sin datos.</p> :
              acc.incomeByMethod.map((r) => <Row key={r.method} label={r.method} value={formatCLP(r.total)} />)}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Gastos por categoría</h3>
            {acc.expenseByCategory.length === 0 ? <p className="text-xs text-muted-foreground">Sin gastos.</p> :
              acc.expenseByCategory.map((r) => <Row key={r.category} label={r.category} value={formatCLP(r.total)} />)}
          </div>
        </div>
      </Section>

      {/* ── Operación ── */}
      <Section title="Operación">
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Servicios más pedidos</h3>
            {dash.byService.map((s) => <Row key={s.label} label={s.label} value={`${s.visits}`} />)}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Por tamaño</h3>
            {dash.bySize.map((s) => <Row key={s.label} label={s.label} value={`${s.visits}`} />)}
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wide mb-2">Por día de la semana</h3>
            {dash.byWeekday.map((d) => <Row key={d.day} label={d.day} value={`${d.visits}`} />)}
          </div>
        </div>
      </Section>

      {/* ── Clientes ── */}
      <Section title="Clientes frecuentes">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-xs text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="py-1.5">Cliente</th><th>Teléfono</th><th className="text-right">Visitas</th><th className="text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {dash.frequentClients.map((c) => (
              <tr key={c.phone} className="border-b border-border/50">
                <td className="py-1.5">{c.name}</td>
                <td className="text-muted-foreground">{c.phone}</td>
                <td className="text-right font-semibold">{c.visits}</td>
                <td className="text-right">{formatCLP(c.total)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Atenciones del mes ── */}
      <Section title={`Atenciones cobradas (${acc.appointments.length})`}>
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="py-1.5">Fecha</th><th>Mascota</th><th>Dueño</th><th>Servicio</th><th>Tamaño</th><th>Pago</th><th className="text-right">Monto</th>
            </tr>
          </thead>
          <tbody>
            {acc.appointments.map((a) => (
              <tr key={a.id} className="border-b border-border/40">
                <td className="py-1">{a.appointment_date}</td>
                <td>{a.pet_name}</td>
                <td>{a.owner_name}</td>
                <td>{serviceLabel(a.service)}</td>
                <td>{sizeLabel(a.size_category)}</td>
                <td>{paymentMethodLabel(a.payment_method)}</td>
                <td className="text-right font-semibold">{formatCLP(Number(a.price_charged))}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      {/* ── Gastos ── */}
      <Section title={`Gastos del mes (${acc.expenses.length})`}>
        {acc.expenses.length === 0 ? <p className="text-xs text-muted-foreground">Sin gastos registrados.</p> : (
          <table className="w-full text-xs">
            <thead>
              <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
                <th className="py-1.5">Fecha</th><th>Categoría</th><th>Detalle</th><th>Pago</th><th className="text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              {acc.expenses.map((e) => (
                <tr key={e.id} className="border-b border-border/40">
                  <td className="py-1">{e.expense_date}</td>
                  <td>{e.category}</td>
                  <td>{e.description ?? '—'}</td>
                  <td>{paymentMethodLabel(e.payment_method)}</td>
                  <td className="text-right font-semibold">{formatCLP(Number(e.amount))}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Section>

      {/* ── Inventario ── */}
      <Section title="Inventario actual">
        <table className="w-full text-xs">
          <thead>
            <tr className="text-left text-[10px] text-muted-foreground uppercase tracking-wide border-b border-border">
              <th className="py-1.5">Producto</th><th>Categoría</th><th className="text-right">Stock</th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-b border-border/40">
                <td className="py-1">{p.display_name}</td>
                <td className="text-muted-foreground">{p.category}</td>
                <td className="text-right font-semibold">{p.current_stock} {p.unit}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Section>

      <footer className="text-[10px] text-muted-foreground border-t border-border pt-3 mt-8">
        Cuatro Huellas — Peluquería Canina · Informe generado automáticamente por el sistema.
      </footer>
    </div>
  )
}
