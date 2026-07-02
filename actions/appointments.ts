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
  const { error } = await supabase.rpc('reschedule_appointment', {
    p_appointment_id: id,
    p_new_date: newDate,
    p_new_time: newTime,
  })

  if (error) {
    if (error.message?.includes('CAPACITY_FULL')) {
      return { success: false, error: 'Ese horario ya tiene 3 perros agendados.' }
    }
    return { success: false, error: 'No se pudo reprogramar.' }
  }
  revalidatePath('/admin/dashboard/agenda')
  return { success: true }
}

interface CreateWalkInResult extends ActionResult {
  appointmentId?: string
}

export async function createWalkIn(input: BookingInput): Promise<CreateWalkInResult> {
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
    p_status: 'arrived',
    p_arrival_time: now,
  })

  if (error) {
    if (error.message?.includes('CAPACITY_FULL')) {
      return { success: false, error: 'Ya hay 3 perros en el local en este momento.' }
    }
    return { success: false, error: 'No se pudo registrar el ingreso.' }
  }

  const appointment = data as Appointment
  revalidatePath('/admin/dashboard')
  return { success: true, appointmentId: appointment.id }
}
