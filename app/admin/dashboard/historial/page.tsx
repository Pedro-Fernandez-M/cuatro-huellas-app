import Link from 'next/link'
import { History, PawPrint } from 'lucide-react'
import { listAppointmentsForRange } from '@/actions/appointments'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { formatDateLong, formatCLP } from '@/lib/date'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  booked: { label: 'Reservado', variant: 'primary' },
  arrived: { label: 'En el local', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'default' },
  no_show: { label: 'No llegó', variant: 'default' },
}

function currentMonth(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`
}

export default async function HistorialPage({
  searchParams,
}: {
  searchParams: Promise<{ mes?: string }>
}) {
  const { mes } = await searchParams
  const month = /^\d{4}-\d{2}$/.test(mes ?? '') ? mes! : currentMonth()

  const from = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, '0')}`

  const appointments = await listAppointmentsForRange(from, to)
  // Historial = solo visitas finalizadas (no las que están por llegar o en atención)
  const FINISHED = ['completed', 'no_show', 'cancelled']
  const sorted = appointments
    .filter((a) => FINISHED.includes(a.status))
    .sort((a, b) =>
      b.appointment_date.localeCompare(a.appointment_date) || b.start_time.localeCompare(a.start_time)
    )

  const completed = sorted.filter((a) => a.status === 'completed')
  const noShow = sorted.filter((a) => a.status === 'no_show')
  const cancelled = sorted.filter((a) => a.status === 'cancelled')
  const monthTotal = completed.reduce((s, a) => s + (Number(a.price_charged) || 0), 0)

  // Agrupar por día
  const byDay = new Map<string, typeof sorted>()
  for (const a of sorted) {
    const list = byDay.get(a.appointment_date) ?? []
    list.push(a)
    byDay.set(a.appointment_date, list)
  }

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Historial de visitas</h1>
      <p className="text-sm text-muted-foreground mb-6">Visitas finalizadas del mes (completadas, no presentadas y canceladas). Las que están en atención aparecen en Inicio.</p>

      <form className="mb-8">
        <input
          type="month"
          name="mes"
          defaultValue={month}
          max={currentMonth()}
          className="h-10 px-3 rounded-xl border border-border bg-input/60 text-sm focus:border-primary outline-none mr-2"
        />
        <button className="h-10 px-4 rounded-xl gradient-warm text-primary-foreground text-sm font-bold hover:opacity-90 transition-all">
          Ver mes
        </button>
      </form>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'Visitas completadas', value: completed.length },
          { label: 'Ingresos del mes', value: formatCLP(monthTotal) },
          { label: 'No llegaron', value: noShow.length },
          { label: 'Canceladas', value: cancelled.length },
        ].map(({ label, value }) => (
          <div key={label} className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-xl font-black text-primary">{value}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      {sorted.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <History className="size-10 mx-auto mb-3 opacity-30" />
          <p>No hay visitas registradas este mes.</p>
        </div>
      ) : (
        <div className="space-y-8">
          {Array.from(byDay.entries()).map(([day, appts]) => (
            <div key={day}>
              <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-3 capitalize">
                {formatDateLong(day)}
              </h2>
              <div className="space-y-2">
                {appts.map((a) => {
                  const badge = STATUS_BADGE[a.status]
                  return (
                    <Link
                      key={a.id}
                      href={`/admin/dashboard/checkin/${a.id}`}
                      className="flex items-center justify-between gap-3 p-3.5 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex-wrap"
                    >
                      <div className="flex items-center gap-3">
                        <span className="text-sm font-semibold text-muted-foreground w-12 shrink-0">{a.start_time.slice(0, 5)}</span>
                        <div>
                          <p className="text-sm font-medium flex items-center gap-1.5">
                            <PawPrint className="size-3.5 text-primary" /> {a.pet_name}
                            <span className="text-muted-foreground font-normal">· {a.owner_name}</span>
                          </p>
                          <p className="text-xs text-muted-foreground">{serviceLabel(a.service)} · {sizeLabel(a.size_category)}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        {a.price_charged != null && (
                          <span className="text-sm font-bold text-primary">{formatCLP(Number(a.price_charged))}</span>
                        )}
                        <Badge variant={badge.variant}>{badge.label}</Badge>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
