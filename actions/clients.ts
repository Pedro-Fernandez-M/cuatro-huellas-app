'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Client, Pet, Appointment } from '@/types'

export interface ClientWithPets extends Client {
  pets: Pet[]
}

export async function searchClientByPhone(phone: string): Promise<ClientWithPets | null> {
  if (!phone.trim()) return null
  const supabase = await createClient()
  const { data: client, error } = await supabase
    .from('clients')
    .select('*')
    .eq('owner_phone', phone.trim())
    .maybeSingle()

  if (error || !client) return null

  const { data: pets } = await supabase.from('pets').select('*').eq('client_id', client.id)
  return { ...(client as Client), pets: (pets as Pet[]) ?? [] }
}

export async function getClient(id: string): Promise<ClientWithPets | null> {
  const supabase = await createClient()
  const { data: client, error } = await supabase.from('clients').select('*').eq('id', id).maybeSingle()
  if (error || !client) return null

  const { data: pets } = await supabase.from('pets').select('*').eq('client_id', id)
  return { ...(client as Client), pets: (pets as Pet[]) ?? [] }
}

export async function listClients(query?: string): Promise<ClientWithPets[]> {
  const supabase = await createClient()
  let q = supabase.from('clients').select('*').order('created_at', { ascending: false })
  if (query && query.trim()) {
    q = q.or(`owner_name.ilike.%${query.trim()}%,owner_phone.ilike.%${query.trim()}%`)
  }
  const { data: clients, error } = await q
  if (error || !clients) return []

  const { data: pets } = await supabase
    .from('pets')
    .select('*')
    .in('client_id', clients.map((c) => c.id))

  return (clients as Client[]).map((c) => ({
    ...c,
    pets: ((pets as Pet[]) ?? []).filter((p) => p.client_id === c.id),
  }))
}

export async function getClientAppointmentHistory(clientId: string): Promise<Appointment[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('appointments')
    .select('*')
    .eq('client_id', clientId)
    .order('appointment_date', { ascending: false })
  if (error) return []
  return data as Appointment[]
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function updateClient(
  id: string,
  fields: { owner_name?: string; owner_phone?: string }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('clients').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/clients')
  return { success: true }
}

export async function getPet(id: string): Promise<Pet | null> {
  const supabase = await createClient()
  const { data, error } = await supabase.from('pets').select('*').eq('id', id).maybeSingle()
  if (error || !data) return null
  return data as Pet
}

export async function updatePet(
  id: string,
  fields: {
    name?: string
    breed?: string
    size_category?: Pet['size_category']
    temperament?: string | null
    allergies?: string | null
    notes?: string | null
  }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('pets').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/clients')
  return { success: true }
}
