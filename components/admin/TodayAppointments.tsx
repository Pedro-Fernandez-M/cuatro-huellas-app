'use client'

import { useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Clock, LogIn, UserX, Loader2, ChevronRight } from 'lucide-react'
import type { Appointment } from '@/types'
import { checkIn, markNoShow } from '@/actions/appointments'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { Badge } from '@/components/ui/badge'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  booked: { label: 'Reservado', variant: 'primary' },
  arrived: { label: 'En el local', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'default' },
  no_show: { label: 'No llegó', variant: 'default' },
}

function Row({ appt }: { appt: Appointment }) {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const badge = STATUS_BADGE[appt.status]

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
        <Badge variant={badge.variant}>{badge.label}</Badge>

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
          <Link
            href={`/admin/dashboard/checkin/${appt.id}`}
            className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-bold gradient-warm text-primary-foreground hover:opacity-90 transition-all"
          >
            Marcar salida <ChevronRight className="size-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}

export default function TodayAppointments({ appointments }: { appointments: Appointment[] }) {
  return (
    <div className="space-y-3">
      {appointments.map((a) => (
        <Row key={a.id} appt={a} />
      ))}
    </div>
  )
}
