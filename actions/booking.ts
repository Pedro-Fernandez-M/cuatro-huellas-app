'use server'

import { after } from 'next/server'
import { createClient } from '@/lib/supabase/server'
import { getAvailableSlots } from '@/lib/scheduling/availability'
import { durationForSize } from '@/lib/constants/sizes'
import { formatDateLongCap } from '@/lib/date'
import { sendPushToStaff } from '@/lib/push'
import type { BookingInput, Appointment } from '@/types'

export async function getAvailableSlotsAction(
  date: string,
  size: BookingInput['sizeCategory'],
  staffId?: string | null,
) {
  try {
    return await getAvailableSlots(date, size, staffId)
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
    const baseParams = {
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
      p_source: 'online' as const,
      p_status: 'booked' as const,
      p_arrival_time: null,
    }

    // Con persona elegida (migración 12). Si la función nueva aún no existe, se
    // reintenta sin p_staff_id para no bloquear la reserva.
    let { data, error } = await supabase.rpc('book_appointment', { ...baseParams, p_staff_id: input.staffId ?? null })
    if (error && !error.message?.includes('CAPACITY_FULL')) {
      ;({ data, error } = await supabase.rpc('book_appointment', baseParams))
    }

    if (error) {
      if (error.message?.includes('CAPACITY_FULL')) {
        return { success: false, error: 'Ese horario se acaba de ocupar. Por favor elige otro.' }
      }
      return { success: false, error: 'No pudimos crear tu reserva. Intenta nuevamente.' }
    }

    const appointment = data as Appointment

    // El aviso al staff sale DESPUÉS de responderle al cliente: con `after` la
    // reserva se confirma al instante aunque el servicio de push esté lento, y
    // si el envío falla la reserva ya quedó guardada igual.
    after(async () => {
      try {
        await sendPushToStaff({
          title: 'Nueva reserva online',
          body: `${input.petName.trim()} — ${formatDateLongCap(input.date)} a las ${input.time}`,
          url: '/admin/dashboard/agenda',
          tag: `cita-${appointment.id}`,
        })
      } catch (err) {
        console.error('[booking] no se pudo notificar al staff', err)
      }
    })

    return { success: true, appointmentId: appointment.id }
  } catch {
    return { success: false, error: 'No se pudo conectar con Supabase. Revisa la configuración del proyecto en Vercel.' }
  }
}
