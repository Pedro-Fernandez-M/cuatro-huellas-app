import Link from 'next/link'
import { CalendarDays, UserPlus, PawPrint } from 'lucide-react'
import { listAppointmentsForDate, listAppointmentsForRange, countInShopNow } from '@/actions/appointments'
import { listBlockedDates } from '@/actions/agenda'
import { getCurrentStaff, getActiveStaff } from '@/actions/staff'
import { todayInShopTz, formatDateLong } from '@/lib/date'
import { workDatesThisWeek, computeFreeHours } from '@/lib/scheduling/freeHours'
import TodayAppointments from '@/components/admin/TodayAppointments'
import { FreeHoursPanel, type FreeHoursItem } from '@/components/admin/FreeHoursPanel'

export const dynamic = 'force-dynamic'

export default async function AdminHomePage() {
  const today = todayInShopTz()
  const weekDates = workDatesThisWeek(today)
  const weekEnd = weekDates[weekDates.length - 1] ?? today

  const [appointments, inShopNow, current, allStaff, weekAppts, blocked] = await Promise.all([
    listAppointmentsForDate(today),
    countInShopNow(),
    getCurrentStaff(),
    getActiveStaff(),
    listAppointmentsForRange(today, weekEnd),
    listBlockedDates(),
  ])

  const bookedCount = appointments.filter((a) => a.status === 'booked').length
  const completedCount = appointments.filter((a) => a.status === 'completed').length

  // Horas disponibles: la asistente ve solo las suyas; la admin ve todo el equipo.
  const blockedSet = new Set(blocked.map((b) => b.blocked_date))
  const relevantStaff = current?.role === 'assistant'
    ? allStaff.filter((s) => s.id === current.id)
    : allStaff
  const freeHours: FreeHoursItem[] = relevantStaff.map((s) => {
    const { today: t, week: w } = computeFreeHours(weekAppts, s.id, weekDates, blockedSet)
    return { id: s.id, name: s.name, photoUrl: s.photo_url, today: t, week: w }
  })

  return (
    <div>
      <div className="flex items-center justify-between mb-8 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-black tracking-tight">Hoy</h1>
          <p className="text-sm text-muted-foreground first-letter:uppercase">{formatDateLong(today)}</p>
        </div>
        <div className="flex gap-2">
          <Link href="/admin/dashboard/walk-in" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl gradient-warm text-primary-foreground text-sm font-bold hover:opacity-90 transition-all">
            <UserPlus className="size-4" /> Agregar cita
          </Link>
          <Link href="/admin/dashboard/agenda" className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border text-sm font-semibold hover:bg-secondary/60 transition-all">
            <CalendarDays className="size-4" /> Agenda
          </Link>
        </div>
      </div>

      {freeHours.length > 0 && <FreeHoursPanel items={freeHours} />}

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
        <TodayAppointments appointments={appointments} />
      )}
    </div>
  )
}
