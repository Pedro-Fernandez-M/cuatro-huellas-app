'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, LogIn, UserX, Loader2, ChevronRight, PawPrint, Scissors } from 'lucide-react'
import type { Appointment } from '@/types'
import { checkIn, markNoShow } from '@/actions/appointments'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { formatCLP } from '@/lib/date'
import { Badge } from '@/components/ui/badge'

function Row({ appt }: { appt: Appointment }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()

  function markArrived() {
    startTransition(async () => {
      await checkIn(appt.id, new Date().toISOString())
      router.refresh()
    })
  }

  function markMissed() {
    startTransition(async () => {
      await markNoShow(appt.id)
      router.refresh()
    })
  }

  const arrivedTime = appt.arrival_time
    ? new Date(appt.arrival_time).toLocaleTimeString('es-CL', { hour: '2-digit', minute: '2-digit' })
    : null

  return (
    <div className="flex items-center justify-between gap-4 p-4 rounded-xl border border-border bg-card hover:border-primary/40 transition-all flex-wrap">
      <Link href={`/admin/dashboard/checkin/${appt.id}`} className="flex items-center gap-4 flex-1 min-w-0">
        <div className="flex items-center gap-1.5 text-sm font-semibold text-muted-foreground w-16 shrink-0">
          <Clock className="size-3.5" /> {appt.start_time.slice(0, 5)}
        </div>
        <div className="min-w-0">
          <p className="font-semibold text-sm truncate">{appt.pet_name} <span className="text-muted-foreground font-normal">· {appt.pet_breed}</span></p>
          <p className="text-xs text-muted-foreground truncate">{serviceLabel(appt.service)} · {sizeLabel(appt.size_category)} · {appt.owner_name}</p>
        </div>
      </Link>

      <div className="flex items-center gap-2">
        {appt.status === 'booked' && (
          <>
            <button
              onClick={markArrived}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'oklch(0.55 0.15 150)' }}
              title="Marcar que la mascota llegó al local (hora actual, editable después)"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />} Llegó
            </button>
            <button
              onClick={markMissed}
              disabled={isPending}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-semibold border border-border text-muted-foreground hover:text-destructive hover:border-destructive/40 transition-all disabled:opacity-60"
              title="Marcar que no llegó"
            >
              <UserX className="size-3.5" /> No llegó
            </button>
          </>
        )}

        {appt.status === 'arrived' && (
          <>
            {arrivedTime && <span className="text-xs text-muted-foreground hidden sm:inline">Llegó {arrivedTime}</span>}
            <Link
              href={`/admin/dashboard/checkin/${appt.id}`}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-bold gradient-warm text-primary-foreground hover:opacity-90 transition-all"
            >
              Cerrar atención <ChevronRight className="size-3.5" />
            </Link>
          </>
        )}

        {(appt.status === 'completed' || appt.status === 'no_show') && (
          <>
            {appt.status === 'completed' && appt.price_charged != null && (
              <span className="text-sm font-bold text-primary">{formatCLP(Number(appt.price_charged))}</span>
            )}
            <Badge variant={appt.status === 'completed' ? 'success' : 'default'}>
              {appt.status === 'completed' ? 'Completado' : 'No llegó'}
            </Badge>
          </>
        )}
      </div>
    </div>
  )
}

function Section({ title, icon: Icon, appts, accent }: { title: string; icon: typeof PawPrint; appts: Appointment[]; accent?: boolean }) {
  if (appts.length === 0) return null
  return (
    <div>
      <h2 className={`text-sm font-bold uppercase tracking-wide mb-3 flex items-center gap-2 ${accent ? 'text-primary' : 'text-muted-foreground'}`}>
        <Icon className="size-4" /> {title} <span className="font-normal">({appts.length})</span>
      </h2>
      <div className="space-y-2.5">
        {appts.map((a) => <Row key={a.id} appt={a} />)}
      </div>
    </div>
  )
}

export default function TodayAppointments({ appointments }: { appointments: Appointment[] }) {
  const enAtencion = appointments.filter((a) => a.status === 'arrived')
  const porLlegar = appointments.filter((a) => a.status === 'booked')
  const finalizados = appointments.filter((a) => a.status === 'completed' || a.status === 'no_show')

  return (
    <div className="space-y-8">
      <Section title="En atención" icon={Scissors} appts={enAtencion} accent />
      <Section title="Por llegar" icon={Clock} appts={porLlegar} />
      <Section title="Finalizados hoy" icon={PawPrint} appts={finalizados} />
    </div>
  )
}
