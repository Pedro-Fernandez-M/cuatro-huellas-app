import { listAppointmentsForRange } from '@/actions/appointments'
import { listBlockedDates } from '@/actions/agenda'
import { todayInShopTz } from '@/lib/date'
import AgendaManager from '@/components/admin/AgendaManager'

export const dynamic = 'force-dynamic'

export default async function AgendaPage() {
  const today = todayInShopTz()
  const to = new Date()
  to.setDate(to.getDate() + 45)
  const toStr = to.toISOString().slice(0, 10)

  const [appointments, blockedDates] = await Promise.all([
    listAppointmentsForRange(today, toStr),
    listBlockedDates(),
  ])

  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-8">Agenda</h1>
      <AgendaManager initialAppointments={appointments} initialBlockedDates={blockedDates} />
    </div>
  )
}
