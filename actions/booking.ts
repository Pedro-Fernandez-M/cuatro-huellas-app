'use server'

import { createClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/scheduling/availability'
import { durationForSize } from '@/lib/constants/sizes'
import type { BookingInput, Appointment } from '@/types'

export async function getAvailableSlotsAction(date: string, size: BookingInput['sizeCategory']) {
  try {
    return await getAvailableSlots(date, size)
  } catch {
    return []
  }
}

export async function getBlockedDatesAction(): Promise<string[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('blocked_dates')
      .select('blocked_date')

    if (error) return []
    return (data ?? []).map((d) => d.blocked_date as string)
  } catch {
    return []
  }
}

interface CreateBookingResult {
  success: boolean
  appointmentId?: string
  error?: string
}

export async function createBooking(input: BookingInput): Promise<CreateBookingResult> {
  if (!input.petName.trim() || !input.ownerName.trim() || !input.ownerPhone.trim()) {
    return { success: false, error: 'Faltan datos obligatorios.' }
  }

  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('book_appointment', {
      p_owner_name: input.ownerName.trim(),
      p_owner_phone: input.ownerPhone.trim(),
      p_pet_name: input.petName.trim(),
      p_pet_breed: input.petBreed.trim(),
      p_size_category: input.sizeCategory,
      p_service: input.service,
      p_addons: input.addons,
      p_coat_condition: input.coatCondition,
      p_appointment_date: input.date,
      p_start_time: input.time,
      p_duration_minutes: durationForSize(input.sizeCategory),
      p_source: 'online',
      p_status: 'booked',
      p_arrival_time: null,
    })

    if (error) {
      if (error.message?.includes('CAPACITY_FULL')) {
        return { success: false, error: 'Ese horario se acaba de ocupar. Por favor elige otro.' }
      }
      return { success: false, error: 'No pudimos crear tu reserva. Intenta nuevamente.' }
    }

    const appointment = data as Appointment
    return { success: true, appointmentId: appointment.id }
  } catch {
    return { success: false, error: 'No se pudo conectar con Supabase. Revisa la configuración del proyecto en Vercel.' }
  }
}
