import { createClient } from '@/lib/supabase/server'
import { durationForSize, isMorningOnly, type SizeCategory } from '@/lib/constants/sizes'
import { businessHoursFor } from '@/lib/constants/businessHours'
import { todayInShopTz, nowTimeInShopTz } from '@/lib/date'

export { durationForSize, isMorningOnly, businessHoursFor }

/** Antelación mínima para reservar online (no se puede agendar "sobre la hora"). */
export const BOOKING_LEAD_MINUTES = 60

function toMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number)
  return h * 60 + m
}

/**
 * Horarios disponibles para una fecha + tamaño de perro.
 * La regla de cupo vive en la función SQL `get_available_slots`; acá se aplica
 * ADEMÁS la antelación mínima (1 h) para la reserva online, sin tocar la BD.
 * `enforceLeadTime=false` la desactiva (p.ej. cuando el staff reprograma).
 */
export async function getAvailableSlots(
  date: string,
  size: SizeCategory,
  staffId?: string | null,
  enforceLeadTime = true,
): Promise<string[]> {
  const supabase = await createClient()

  // Disponibilidad por persona (migración 12). Si la función nueva aún no existe,
  // se cae a la versión antigua (cupo global de 3) para no romper la reserva.
  let slots: string[]
  const withStaff = await supabase.rpc('get_available_slots', {
    p_date: date,
    p_size_category: size,
    p_staff_id: staffId ?? null,
  })
  if (!withStaff.error) {
    slots = (withStaff.data as string[] | null) ?? []
  } else {
    const legacy = await supabase.rpc('get_available_slots', {
      p_date: date,
      p_size_category: size,
    })
    if (legacy.error) {
      throw new Error(`No se pudo calcular la disponibilidad: ${legacy.error.message}`)
    }
    slots = (legacy.data as string[] | null) ?? []
  }

  // Solo para HOY: quita los horarios que empiezan en menos de 1 hora.
  if (enforceLeadTime && date === todayInShopTz()) {
    const cutoff = toMinutes(nowTimeInShopTz()) + BOOKING_LEAD_MINUTES
    slots = slots.filter((s) => toMinutes(s) >= cutoff)
  }

  return slots
}
