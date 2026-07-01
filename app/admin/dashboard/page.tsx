import Link from 'next/link'
import { CalendarDays, UserPlus, PawPrint, Clock } from 'lucide-react'
import { listAppointmentsForDate, countInShopNow } from '@/actions/appointments'
import { todayInShopTz, formatDateLong } from '@/lib/date'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { Badge } from '@/components/ui/badge'

export const dynamic = 'force-dynamic'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  booked: { label: 'Reservado', variant: 'primary' },
  arrived: { label: 'En el local', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'default' },
  no_show: { label: 'No llegó', variant: 'default' },
}

export default async function AdminHomePage() {
  const today = todayInShopTz()
  const [appointments, inShopNow] = await Promise.all([
    listAppointmentsForDate(today),
    countInShopNow(),
  ])

  const bookedCount = appointments.filter((a) => a.status === 'booked').length
  const completedCount = appointments.filter((a) => a.status === 'completed').length

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Hoy</h1>
          <p className="text-sm text-muted-foreground capitalize">{formatDateLong(today)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/walk-in" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-warm text-primary-foreground text-sm font-bold hover:opacity-90 transition-all">
            <UserPlus className="size-4" /> Ingreso manual
          </Link>
          <Link href="/admin/dashboard/agenda" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/60 transition-all">
            <CalendarDays className="size-4" /> Agenda
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-10">
        {[
          { label: 'En el local ahora', value: inShopNow, hint: 'máx. 3' },
          { label: 'Reservados hoy', value: bookedCount, hint: '' },
          { label: 'Completados hoy', value: completedCount, hint: '' },
          { label: 'Total citas hoy', value: appointments.length, hint: '' },
        ].map(({ label, value, hint }) => (
          <div key={label} className="p-4 rounded-2xl border border-border bg-card">
            <p className="text-2xl font-black text-primary">{value}{hint && <span className="text-xs text-muted-foreground font-normal ml-1">{hint}</span>}</p>
            <p className="text-xs text-muted-foreground mt-1">{label}</p>
          </div>
        ))}
      </div>

      <h2 className="text-lg font-bold mb-4">Citas de hoy</h2>
      {appointments.length === 0 ? (
        <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
          <PawPrint className="size-10 mx-auto mb-3 opacity-30" />
          <p>No hay citas agendadas para hoy.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {appointments.map((a) => {
            const badge = STATUS_BADGE[a.status]
            return (
              <Link
                key={a.id}
                href={`/admin/dashboard/checkin/${a.id}`}
                className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex-wrap"
              >
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground w-16 shrink-0">
                    <Clock className="size-3.5" /> {a.start_time.slice(0, 5)}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{a.pet_name} <span className="text-muted-foreground font-normal">· {a.pet_breed}</span></p>
                    <p className="text-xs text-muted-foreground">{serviceLabel(a.service)} · {sizeLabel(a.size_category)} · {a.owner_name}</p>
                  </div>
                </div>
                <Badge variant={badge.variant}>{badge.label}</Badge>
              </Link>
            )
          })}
        </div>
      )}
    </div>
  )
}
