'use client'

import { useEffect, useMemo, useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { CalendarDays, CalendarRange, Ban, X, Loader2, Clock, LogIn, ChevronRight, ChevronLeft, List } from 'lucide-react'
import type { Appointment, BlockedDate, PublicStaff } from '@/types'
import { cancelAppointment, markNoShow, rescheduleAppointment, checkIn, listAppointmentsForRange } from '@/actions/appointments'
import { blockDate, unblockDate } from '@/actions/agenda'
import { getAvailableSlotsAction } from '@/actions/booking'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { formatDateLong, todayInShopTz } from '@/lib/date'
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

// Paleta estable para distinguir a cada funcionaria por color.
const STAFF_COLORS = [
  'oklch(0.62 0.13 250)', // azul
  'oklch(0.60 0.13 160)', // verde
  'oklch(0.65 0.15 25)',  // terracota
  'oklch(0.58 0.14 300)', // morado
  'oklch(0.62 0.13 200)', // celeste
]
function staffColorFor(index: number) {
  return STAFF_COLORS[index % STAFF_COLORS.length]
}

// ── Utilidades de fecha (trabajan con strings YYYY-MM-DD, sin zonas raras) ──
function addDays(iso: string, n: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  const dt = new Date(y, m - 1, d + n)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`
}
function weekdayShort(iso: string): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'short' }).replace('.', '')
}
function dayNumber(iso: string): number {
  return Number(iso.split('-')[2])
}

// ── Utilidades del mes (trabajan con claves 'YYYY-MM') ──
function monthOf(iso: string): string {
  return iso.slice(0, 7)
}
function daysInMonth(ym: string): number {
  const [y, m] = ym.split('-').map(Number)
  return new Date(y, m, 0).getDate()
}
function shiftMonth(ym: string, n: number): string {
  const [y, m] = ym.split('-').map(Number)
  const dt = new Date(y, m - 1 + n, 1)
  return `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}`
}
function monthLabel(ym: string): string {
  const [y, m] = ym.split('-').map(Number)
  const s = new Date(y, m - 1, 1).toLocaleDateString('es-CL', { month: 'long', year: 'numeric' })
  return s.charAt(0).toUpperCase() + s.slice(1)
}
/**
 * Celdas de la grilla del mes, empezando en lunes. Los huecos antes del día 1
 * van como null para que cada fecha caiga bajo su día de la semana.
 */
function monthCells(ym: string): (string | null)[] {
  const [y, m] = ym.split('-').map(Number)
  // getDay(): 0 = domingo. Se corre para que lunes sea 0.
  const lead = (new Date(y, m - 1, 1).getDay() + 6) % 7
  const total = daysInMonth(ym)
  const cells: (string | null)[] = Array(lead).fill(null)
  for (let d = 1; d <= total; d++) {
    cells.push(`${ym}-${String(d).padStart(2, '0')}`)
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

const WEEKDAY_HEADS = ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb', 'Dom']

const ACTIVE_STATUSES = new Set(['booked', 'arrived', 'completed'])

interface StaffInfo { name: string; color: string }

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
    const available = await getAvailableSlotsAction(d, appt.size_category, appt.staff_id)
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

function AppointmentRow({ appt, staffInfo }: { appt: Appointment; staffInfo: StaffInfo | null }) {
  const router = useRouter()
  const [rescheduling, setRescheduling] = useState(false)
  const [isPending, startTransition] = useTransition()
  const badge = STATUS_BADGE[appt.status]
  const canModify = appt.status === 'booked' || appt.status === 'arrived'
  const dimmed = appt.status === 'cancelled' || appt.status === 'no_show'

  return (
    <div
      className={`p-4 rounded-xl border bg-card flex gap-3 ${dimmed ? 'opacity-55' : ''}`}
      style={staffInfo ? { borderLeft: `4px solid ${staffInfo.color}` } : undefined}
    >
      {/* Hora grande a la izquierda */}
      <div className="shrink-0 w-14 text-center">
        <p className="text-lg font-black leading-none">{appt.start_time.slice(0, 5)}</p>
        <p className="text-[10px] text-muted-foreground mt-1">{Math.round(appt.duration_minutes / 60)}h</p>
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3 flex-wrap">
          <div className="min-w-0">
            <p className="font-semibold text-sm">{appt.pet_name} <span className="text-muted-foreground font-normal">· {appt.pet_breed}</span></p>
            <p className="text-xs text-muted-foreground">{serviceLabel(appt.service)} · {sizeLabel(appt.size_category)} · {appt.owner_name} · {appt.owner_phone}</p>
            {staffInfo && (
              <p className="text-xs font-semibold mt-1 flex items-center gap-1.5" style={{ color: staffInfo.color }}>
                <span className="size-2 rounded-full" style={{ backgroundColor: staffInfo.color }} /> {staffInfo.name}
              </p>
            )}
          </div>
          <Badge variant={badge.variant}>{badge.label}</Badge>
        </div>

        <div className="flex items-center gap-2 flex-wrap mt-3">
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
        {rescheduling && <RescheduleForm appt={appt} onDone={() => setRescheduling(false)} />}
      </div>
    </div>
  )
}

export default function AgendaManager({
  initialAppointments,
  initialBlockedDates,
  staff = [],
}: {
  initialAppointments: Appointment[]
  initialBlockedDates: BlockedDate[]
  staff?: PublicStaff[]
}) {
  const today = todayInShopTz()
  const [selectedDate, setSelectedDate] = useState(today)
  const [staffFilter, setStaffFilter] = useState<string>('all')
  const [blockDateValue, setBlockDateValue] = useState('')
  const [blockReason, setBlockReason] = useState('')
  const [isPending, startTransition] = useTransition()
  const [error, setError] = useState<string | null>(null)

  // Vista de mes completo. La página solo trae ~45 días, así que al abrir un
  // mes fuera de ese rango se piden esas citas aparte (solo lectura).
  const [monthView, setMonthView] = useState(false)
  const [monthCursor, setMonthCursor] = useState(() => monthOf(today))
  const [monthAppts, setMonthAppts] = useState<Appointment[]>([])
  const [loadingMonth, setLoadingMonth] = useState(false)

  useEffect(() => {
    if (!monthView) return
    let alive = true

    async function loadMonth() {
      setLoadingMonth(true)
      const from = `${monthCursor}-01`
      const to = `${monthCursor}-${String(daysInMonth(monthCursor)).padStart(2, '0')}`
      const rows = await listAppointmentsForRange(from, to)
      if (!alive) return
      setMonthAppts(rows)
      setLoadingMonth(false)
    }

    loadMonth()
    return () => { alive = false }
    // initialAppointments entra a propósito: si una acción refresca la página,
    // el mes se vuelve a pedir y no queda mostrando datos viejos.
  }, [monthView, monthCursor, initialAppointments])

  // Mapa id -> {nombre, color}
  const staffMap = useMemo(() => {
    const m = new Map<string, StaffInfo>()
    staff.forEach((s, i) => m.set(s.id, { name: s.name, color: staffColorFor(i) }))
    return m
  }, [staff])

  // Agrupa las citas por fecha. Se juntan las de la página con las del mes
  // abierto, deduplicando por id: las de la página mandan porque son las más
  // frescas después de una acción.
  const byDate = useMemo(() => {
    const unique = new Map<string, Appointment>()
    for (const a of monthAppts) unique.set(a.id, a)
    for (const a of initialAppointments) unique.set(a.id, a)

    const m = new Map<string, Appointment[]>()
    for (const a of unique.values()) {
      const arr = m.get(a.appointment_date) ?? []
      arr.push(a)
      m.set(a.appointment_date, arr)
    }
    return m
  }, [initialAppointments, monthAppts])

  const blockedSet = useMemo(() => new Set(initialBlockedDates.map((b) => b.blocked_date)), [initialBlockedDates])

  const matchesFilter = (a: Appointment) => staffFilter === 'all' || a.staff_id === staffFilter

  // Tira de días (14 días desde hoy)
  const stripDays = Array.from({ length: 14 }, (_, i) => addDays(today, i))
  const activeCountFor = (iso: string) =>
    (byDate.get(iso) ?? []).filter((a) => ACTIVE_STATUSES.has(a.status) && matchesFilter(a)).length

  const dayAppts = (byDate.get(selectedDate) ?? [])
    .filter(matchesFilter)
    .slice()
    .sort((a, b) => a.start_time.localeCompare(b.start_time))

  const selectedLabel =
    selectedDate === today ? 'Hoy'
      : selectedDate === addDays(today, 1) ? 'Mañana'
        : formatDateLong(selectedDate)

  const isSelectedBlocked = blockedSet.has(selectedDate)

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
    <div className="space-y-6">
      {/* Filtro por persona */}
      {staff.length > 0 && (
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={() => setStaffFilter('all')}
            className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all ${staffFilter === 'all' ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/50'}`}
          >
            Todas
          </button>
          {staff.map((s) => {
            const color = staffMap.get(s.id)!.color
            const active = staffFilter === s.id
            return (
              <button
                key={s.id}
                onClick={() => setStaffFilter(s.id)}
                className={`px-3 py-1.5 rounded-full text-xs font-semibold border transition-all flex items-center gap-1.5 ${active ? 'text-white border-transparent' : 'border-border bg-card hover:border-primary/50'}`}
                style={active ? { backgroundColor: color } : undefined}
              >
                <span className="size-2 rounded-full" style={{ backgroundColor: active ? 'white' : color }} /> {s.name}
              </button>
            )
          })}
        </div>
      )}

      {/* Cambio entre la tira de días y el mes completo */}
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <button
          onClick={() => {
            const next = !monthView
            setMonthView(next)
            // Al abrir el mes, partir en el del día que se está mirando.
            if (next) setMonthCursor(monthOf(selectedDate))
          }}
          className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl border border-border bg-card text-sm font-bold hover:border-primary/50 transition-all"
        >
          {monthView ? <><List className="size-4" /> Ver por días</> : <><CalendarRange className="size-4" /> Ver mes completo</>}
        </button>
        {monthView && loadingMonth && (
          <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" /> Cargando el mes…
          </span>
        )}
      </div>

      {/* Mes completo */}
      {monthView && (
        <div className="rounded-2xl border border-border bg-card p-4">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={() => setMonthCursor(shiftMonth(monthCursor, -1))}
              className="size-9 rounded-lg border border-border flex items-center justify-center hover:border-primary/50 transition-all"
              aria-label="Mes anterior"
            >
              <ChevronLeft className="size-4" />
            </button>
            <p className="text-lg font-black tracking-tight">{monthLabel(monthCursor)}</p>
            <button
              onClick={() => setMonthCursor(shiftMonth(monthCursor, 1))}
              className="size-9 rounded-lg border border-border flex items-center justify-center hover:border-primary/50 transition-all"
              aria-label="Mes siguiente"
            >
              <ChevronRight className="size-4" />
            </button>
          </div>

          <div className="grid grid-cols-7 gap-1.5 mb-1.5">
            {WEEKDAY_HEADS.map((d) => (
              <p key={d} className="text-center text-[11px] font-bold uppercase tracking-wide text-muted-foreground">{d}</p>
            ))}
          </div>

          <div className="grid grid-cols-7 gap-1.5">
            {monthCells(monthCursor).map((iso, i) => {
              if (!iso) return <div key={`empty-${i}`} />
              const isSel = iso === selectedDate
              const isToday = iso === today
              const isBlocked = blockedSet.has(iso)
              const count = activeCountFor(iso)
              return (
                <button
                  key={iso}
                  onClick={() => setSelectedDate(iso)}
                  className={`aspect-square rounded-xl border p-1 flex flex-col items-center justify-center gap-0.5 transition-all ${
                    isSel
                      ? 'bg-primary text-primary-foreground border-primary'
                      : isToday
                        ? 'border-primary/60 bg-primary/5 hover:border-primary'
                        : 'border-border hover:border-primary/50'
                  }`}
                >
                  <span className="text-base font-black leading-none">{dayNumber(iso)}</span>
                  {isBlocked ? (
                    <span className={`text-[9px] font-bold ${isSel ? 'text-primary-foreground/80' : 'text-destructive'}`}>bloq.</span>
                  ) : count > 0 ? (
                    <span className={`inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold ${isSel ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary'}`}>{count}</span>
                  ) : (
                    <span className="h-4" />
                  )}
                </button>
              )
            })}
          </div>

          <p className="text-xs text-muted-foreground mt-4 text-center">
            El número en cada día son las citas activas. Toca un día para ver el detalle abajo.
          </p>
        </div>
      )}

      {/* Tira de días tipo calendario */}
      {!monthView && (
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, -1))}
          disabled={selectedDate <= today}
          className="shrink-0 size-9 rounded-lg border border-border bg-card flex items-center justify-center hover:border-primary/50 disabled:opacity-30 transition-all"
          aria-label="Día anterior"
        >
          <ChevronLeft className="size-4" />
        </button>
        <div className="flex-1 flex gap-1.5 overflow-x-auto pb-1">
          {stripDays.map((iso) => {
            const isSel = iso === selectedDate
            const isBlocked = blockedSet.has(iso)
            const count = activeCountFor(iso)
            return (
              <button
                key={iso}
                onClick={() => setSelectedDate(iso)}
                className={`shrink-0 w-14 py-2 rounded-xl border text-center transition-all relative ${isSel ? 'bg-primary text-primary-foreground border-primary' : 'border-border bg-card hover:border-primary/50'}`}
              >
                <p className={`text-[10px] uppercase font-semibold ${isSel ? 'text-primary-foreground/80' : 'text-muted-foreground'}`}>{weekdayShort(iso)}</p>
                <p className="text-lg font-black leading-tight">{dayNumber(iso)}</p>
                {isBlocked ? (
                  <span className={`text-[9px] ${isSel ? 'text-primary-foreground/80' : 'text-destructive'}`}>bloq.</span>
                ) : count > 0 ? (
                  <span className={`inline-flex items-center justify-center min-w-4 h-4 px-1 rounded-full text-[10px] font-bold ${isSel ? 'bg-primary-foreground text-primary' : 'bg-primary/15 text-primary'}`}>{count}</span>
                ) : (
                  <span className="text-[9px] text-transparent">·</span>
                )}
              </button>
            )
          })}
        </div>
        <button
          onClick={() => setSelectedDate(addDays(selectedDate, 1))}
          className="shrink-0 size-9 rounded-lg border border-border bg-card flex items-center justify-center hover:border-primary/50 transition-all"
          aria-label="Día siguiente"
        >
          <ChevronRight className="size-4" />
        </button>
        <Input
          type="date"
          value={selectedDate}
          min={today}
          onChange={(e) => e.target.value && setSelectedDate(e.target.value)}
          className="w-auto shrink-0 hidden sm:block"
        />
      </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Citas del día seleccionado */}
        <div className="lg:col-span-2 space-y-3">
          <h2 className="text-lg font-black tracking-tight first-letter:uppercase">
            {selectedLabel}
            {dayAppts.length > 0 && <span className="text-sm font-semibold text-muted-foreground ml-2">· {dayAppts.length} cita{dayAppts.length > 1 ? 's' : ''}</span>}
          </h2>
          {isSelectedBlocked && (
            <div className="p-3 rounded-xl bg-destructive/5 border border-destructive/30 text-sm text-destructive flex items-center gap-2">
              <Ban className="size-4" /> Día bloqueado — no se reciben reservas online.
            </div>
          )}
          {dayAppts.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground border border-dashed border-border rounded-2xl">
              <CalendarDays className="size-10 mx-auto mb-3 opacity-30" />
              <p>Sin citas para este día.</p>
            </div>
          ) : (
            dayAppts.map((a) => (
              <AppointmentRow key={a.id} appt={a} staffInfo={a.staff_id ? staffMap.get(a.staff_id) ?? null : null} />
            ))
          )}
        </div>

        {/* Bloquear días */}
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
                  <p className="font-medium first-letter:uppercase">{formatDateLong(b.blocked_date)}</p>
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
    </div>
  )
}
