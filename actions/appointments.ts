'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { durationForSize } from '@/lib/constants/sizes'
import type { Appointment, BookingInput } from '@/types'

export async function getAppointment(id: string): Promise<Appointment | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('appointments').select('*').eq('id', id).single()
  if (error) return null
  return data as Appointment
}

export async function listAppointmentsForDate(date: string): Promise<Appointment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('appointment_date', date)
    .neq('status', 'cancelled')
    .order('start_time', { ascending: true })
  if (error) return []
  return data as Appointment[]
}

export async function listAppointmentsForRange(from: string, to: string): Promise<Appointment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .gte('appointment_date', from)
    .lte('appointment_date', to)
    .order('appointment_date', { ascending: true })
    .order('start_time', { ascending: true })
  if (error) return []
  return data as Appointment[]
}

export async function countInShopNow(): Promise<number> {
  const supabase = await createClient()
  const { count, error } = await supabase
    .from('appointments')
    .select('id', { count: 'exact', head: true })
    .eq('status', 'arrived')
  if (error) return 0
  return count ?? 0
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function checkIn(id: string, arrivalTime: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'arrived', arrival_time: arrivalTime, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function checkOut(
  id: string,
  departureTime: string,
  priceCharged: number,
  paymentMethod?: string | null
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({
      status: 'completed',
      departure_time: departureTime,
      price_charged: priceCharged,
      payment_method: paymentMethod ?? null,
      updated_at: new Date().toISOString(),
    })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/dashboard/ingresos')
  revalidatePath('/admin/dashboard/contabilidad')
  return { success: true }
}

export async function updateArrivalDeparture(
  id: string,
  fields: { arrival_time?: string | null; departure_time?: string | null; price_charged?: number | null }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ ...fields, updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard')
  return { success: true }
}

export async function cancelAppointment(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'cancelled', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/agenda')
  return { success: true }
}

export async function markNoShow(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('appointments')
    .update({ status: 'no_show', updated_at: new Date().toISOString() })
    .eq('id', id)

  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/agenda')
  return { success: true }
}

export async function rescheduleAppointment(
  id: string,
  newDate: string,
  newTime: string
): Promise<ActionResult> {
  const supabase = await createClient()
  // El staff puede mover citas libremente (p_force), aunque el horario esté lleno.
  const { error } = await supabase.rpc('reschedule_appointment', {
    p_appointment_id: id,
    p_new_date: newDate,
    p_new_time: newTime,
    p_force: true,
  })

  if (error) {
    return { success: false, error: 'No se pudo reprogramar.' }
  }
  revalidatePath('/admin/dashboard/agenda')
  return { success: true }
}

interface CreateWalkInResult extends ActionResult {
  appointmentId?: string
}

/**
 * Alta manual desde el panel. El staff está presente y decide, así que
 * NO se aplica el tope de 3 perros ni la grilla de horarios (p_force).
 * `alreadyHere` = la mascota ya está en el local (se marca como "en atención").
 */
export async function createWalkIn(
  input: BookingInput,
  alreadyHere = true
): Promise<CreateWalkInResult> {
  if (!input.petName.trim() || !input.ownerName.trim() || !input.ownerPhone.trim()) {
    return { success: false, error: 'Faltan datos obligatorios.' }
  }

  const supabase = await createClient()
  const now = new Date().toISOString()
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
    p_source: 'walk_in',
    p_status: alreadyHere ? 'arrived' : 'booked',
    p_arrival_time: alreadyHere ? now : null,
    p_force: true,
  })

  if (error) {
    return { success: false, error: 'No se pudo registrar. Intenta nuevamente.' }
  }

  const appointment = data as Appointment
  revalidatePath('/admin/dashboard')
  revalidatePath('/admin/dashboard/agenda')
  return { success: true, appointmentId: appointment.id }
}
