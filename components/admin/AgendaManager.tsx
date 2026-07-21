'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, Ban, X, Loader2, Clock, LogIn, ChevronRight } from 'lucide-react'
import type { Appointment, BlockedDate } from '@/types'
import { cancelAppointment, markNoShow, rescheduleAppointment, checkIn } from '@/actions/appointments'
import { blockDate, unblockDate } from '@/actions/agenda'
import { getAvailableSlotsAction } from '@/actions/booking'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { formatDateLong } from '@/lib/date'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { WhatsAppButton } from '@/components/admin/WhatsAppButton'

const STATUS_BADGE: Record<string, { label: string; variant: 'default' | 'primary' | 'success' | 'warning' }> = {
  booked: { label: 'Reservado', variant: 'primary' },
  arrived: { label: 'En el local', variant: 'warning' },
  completed: { label: 'Completado', variant: 'success' },
  cancelled: { label: 'Cancelado', variant: 'default' },
  no_show: { label: 'No llegó', variant: 'default' },
}

function RescheduleForm({ appt, onDone }: { appt: Appointment; onDone: () => void }) {
  const [date, setDate] = useState(appt.appointment_date)
  const [slots, setSlots] = useState<string[]>([])
  const [time, setTime] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isPending, startTransition] = useTransition()

  async function loadSlots(d: string) {
    setDate(d)
    setTime(null)
    setLoading(true)
    const available = await getAvailableSlotsAction(d, appt.size_category)
    setSlots(available)
    setLoading(false)
  }

  function submit() {
    if (!time) return
    setError(null)
    startTransition(async () => {
      const result = await rescheduleAppointment(appt.id, date, time)
      if (result.success) onDone()
      else setError(result.error ?? 'No se pudo reprogramar')
    })
  }

  return (
    <div className="mt-3 p-4 rounded-xl bg-secondary/40 border border-border space-y-3">
      <Input type="date" value={date} onChange={(e) => loadSlots(e.target.value)} />
      {loading && <Loader2 className="size-4 animate-spin text-primary" />}
      {!loading && slots.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {slots.map((s) => (
            <button
              key={s}
              onClick={() => setTime(s)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition-all ${time === s ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/50'}`}
            >
              {s}
            </button>
          ))}
        </div>
      )}
      {!loading && slots.length === 0 && <p className="text-xs text-muted-foreground">No hay horarios disponibles ese día.</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
      <div className="flex gap-2">
        <Button size="sm" onClick={submit} disabled={!time || isPending}>
          {isPending ? <Loader2 className="size-3.5 animate-spin" /> : 'Confirmar'}
        </Button>
        <Button size="sm" variant="ghost" onClick={onDone}>Cancelar</Button>
      </div>
    </div>
  )
}

function AppointmentRow({ appt }: { appt: Appointment }) {
  const router = useRouter()
  const [rescheduling, setRescheduling] = useState(false)
  const [isPending, startTransition] = useTransition()
  const badge = STATUS_BADGE[appt.status]
  const canModify = appt.status === 'booked' || appt.status === 'arrived'

  return (
    <div className="p-4 rounded-xl border border-border bg-card">
      <div className="flex items-center justify-between gap-4 flex-wrap">
        <div>
          <p className="text-xs text-muted-foreground capitalize mb-0.5">{formatDateLong(appt.appointment_date)} · {appt.start_time.slice(0, 5)}</p>
          <p className="font-semibold text-sm">{appt.pet_name} <span className="text-muted-foreground font-normal">· {appt.pet_breed}</span></p>
          <p className="text-xs text-muted-foreground">{serviceLabel(appt.service)} · {sizeLabel(appt.size_category)} · {appt.owner_name} · {appt.owner_phone}</p>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          <Badge variant={badge.variant}>{badge.label}</Badge>
          <WhatsAppButton appointment={appt} />

          {appt.status === 'booked' && (
            <button
              disabled={isPending}
              onClick={() => startTransition(async () => { await checkIn(appt.id, new Date().toISOString()); router.refresh() })}
              className="inline-flex items-center gap-1.5 h-9 px-3 rounded-lg text-xs font-bold text-white transition-all hover:opacity-90 disabled:opacity-60"
              style={{ backgroundColor: 'oklch(0.55 0.15 150)' }}
              title="Marcar que la mascota llegó (hora actual, editable después)"
            >
              {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <LogIn className="size-3.5" />} Llegó
            </button>
          )}

          {appt.status === 'arrived' && (
            <Link
              href={`/admin/dashboard/checkin/${appt.id}`}
              className="inline-flex items-center gap-1 h-9 px-3 rounded-lg text-xs font-bold gradient-warm text-primary-foreground hover:opacity-90 transition-all"
            >
              Cerrar atención <ChevronRight className="size-3.5" />
            </Link>
          )}

          {canModify && (
            <>
              <Button size="sm" variant="outline" onClick={() => setRescheduling((v) => !v)}>
                <Clock className="size-3.5" /> Reprogramar
              </Button>
              <Button
                size="sm" variant="ghost"
                disabled={isPending}
                onClick={() => startTransition(async () => { await cancelAppointment(appt.id) })}
              >
                <X className="size-3.5" /> Cancelar
              </Button>
              {appt.status === 'booked' && (
                <Button
                  size="sm" variant="ghost"
                  disabled={isPending}
                  onClick={() => startTransition(async () => { await markNoShow(appt.id) })}
                >
                  No llegó
                </Button>
              )}
            </>
          )}
        </div>
      </div>
      {rescheduling && <RescheduleForm appt={appt} onDone={() => setRescheduling(false)} />}
    </div>
  )
}

export default function AgendaManager({
  initialAppointments,
  initialBlockedDates,
}: {
  initialAppointments: Appointment[]
  initialBlockedDates: BlockedDate[]
}) {
  const [blockDateValue, setBlockDateValue] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  function submitBlock() {
    if (!blockDateValue) return
    setError(null)
    startTransition(async () => {
      const result = await blockDate(blockDateValue, blockReason || undefined)
      if (!result.success) setError(result.error ?? 'No se pudo bloquear')
      else { setBlockDateValue(''); setBlockReason('') }
    })
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <div className="lg:col-span-2 space-y-3">
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Próximas citas</h2>
        {initialAppointments.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
            <CalendarDays className="size-10 mx-auto mb-3 opacity-30" />
            <p>No hay citas próximas.</p>
          </div>
        ) : (
          initialAppointments.map((a) => <AppointmentRow key={a.id} appt={a} />)
        )}
      </div>

      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wide mb-2">Bloquear días</h2>
        <div className="p-4 rounded-xl border border-border bg-card space-y-3 mb-4">
          <Input type="date" value={blockDateValue} onChange={(e) => setBlockDateValue(e.target.value)} />
          <Input placeholder="Motivo (opcional)" value={blockReason} onChange={(e) => setBlockReason(e.target.value)} />
          {error && <p className="text-xs text-destructive">{error}</p>}
          <Button size="sm" className="w-full" disabled={!blockDateValue || isPending} onClick={submitBlock}>
            <Ban className="size-3.5" /> Bloquear día
          </Button>
        </div>
        <div className="space-y-2">
          {initialBlockedDates.map((b) => (
            <div key={b.id} className="flex items-center justify-between p-3 rounded-lg border border-border bg-card text-sm">
              <div>
                <p className="font-medium capitalize">{formatDateLong(b.blocked_date)}</p>
                {b.reason && <p className="text-xs text-muted-foreground">{b.reason}</p>}
              </div>
              <button
                onClick={() => startTransition(async () => { await unblockDate(b.id) })}
                className="text-xs text-muted-foreground hover:text-destructive transition-colors"
              >
                Quitar
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
