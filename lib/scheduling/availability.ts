import { createClient } from '@/lib/supabase/server'
import { durationForSize, isMorningOnly, type SizeCategory } from '@/lib/constants/sizes'
import { businessHoursFor } from '@/lib/constants/businessHours'

export { durationForSize, isMorningOnly, businessHoursFor }

/**
 * Horarios disponibles para una fecha + tamaño de perro.
 * La regla de negocio real vive en la función SQL `get_available_slots`
 * (ver SQL.md) — se reutiliza igual para la reserva online, el walk-in
 * y la reprogramación, así el cupo de 3 perros nunca queda inconsistente
 * entre pantallas.
 */
export async function getAvailableSlots(date: string, size: SizeCategory): Promise<string[]> {
  const supabase = await createClient()
  const { data, error } = await supabase.rpc('get_available_slots', {
    p_date: date,
    p_size_category: size,
  })

  if (error) {
    throw new Error(`No se pudo calcular la disponibilidad: ${error.message}`)
  }

  return (data as string[] | null) ?? []
}
