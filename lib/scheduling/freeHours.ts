import { businessHoursFor } from '@/lib/constants/businessHours'
import { todayInShopTz, nowTimeInShopTz } from '@/lib/date'
import type { Appointment } from '@/types'

const ACTIVE = new Set(['booked', 'arrived', 'completed'])

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

export interface FreeHours {
  today: number // horas libres restantes hoy
  week: number  // horas libres desde hoy hasta el sábado de esta semana
}

/**
 * Fechas laborales desde HOY hasta el sábado de esta semana (excluye domingo).
 * Se cuenta solo lo que queda por delante — las horas ya pasadas no sirven.
 */
export function workDatesThisWeek(today: string): string[] {
  const [y, m, d] = today.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay() // 0=dom ... 6=sáb
  if (dow === 0) return [] // domingo: la semana laboral ya terminó
  const untilSaturday = 6 - dow
  const out: string[] = []
  for (let i = 0; i <= untilSaturday; i++) {
    const dt = new Date(y, m - 1, d + i)
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`)
  }
  return out
}

/**
 * Horas libres de UNA funcionaria: ventana del local menos lo que ya tiene
 * agendado (citas activas). Para hoy, la ventana arranca en la hora actual.
 */
export function computeFreeHours(
  appts: Appointment[],
  staffId: string,
  dates: string[],
  blocked: Set<string>,
): FreeHours {
  const today = todayInShopTz()
  const nowMin = toMinutes(nowTimeInShopTz())
  let todayH = 0
  let weekH = 0

  for (const iso of dates) {
    if (blocked.has(iso)) continue
    const [y, m, d] = iso.split('-').map(Number)
    const bh = businessHoursFor(new Date(y, m - 1, d).getDay())
    if (!bh) continue

    let openMin = toMinutes(bh.open)
    const closeMin = toMinutes(bh.close)
    if (iso === today) openMin = Math.max(openMin, nowMin) // hoy: descuenta lo ya transcurrido
    const windowMin = Math.max(0, closeMin - openMin)

    let booked = 0
    for (const a of appts) {
      if (a.appointment_date !== iso || a.staff_id !== staffId || !ACTIVE.has(a.status)) continue
      const start = toMinutes(a.start_time.slice(0, 5))
      const end = start + a.duration_minutes
      booked += Math.max(0, Math.min(end, closeMin) - Math.max(start, openMin))
    }

    const free = Math.max(0, windowMin - booked)
    weekH += free
    if (iso === today) todayH = free
  }

  return { today: todayH / 60, week: weekH / 60 }
}
