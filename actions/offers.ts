'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Offer } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
}

function revalidateOffers() {
  revalidatePath('/')
  revalidatePath('/reservar')
  revalidatePath('/admin/dashboard/ofertas')
}

/** Ofertas activas para mostrar en la web pública. Silenciosa si la tabla aún no existe. */
export async function getActiveOffers(): Promise<Offer[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data as Offer[]
  } catch {
    return []
  }
}

/** Todas las ofertas (activas e inactivas) para el panel admin. */
export async function getAllOffers(): Promise<Offer[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase
      .from('offers')
      .select('*')
      .order('created_at', { ascending: false })
    if (error || !data) return []
    return data as Offer[]
  } catch {
    return []
  }
}

export async function addOffer(input: { message: string; emoji?: string }): Promise<ActionResult> {
  if (!input.message.trim()) return { success: false, error: 'Escribe el mensaje de la oferta.' }
  const supabase = await createClient()
  const { error } = await supabase.from('offers').insert({
    message: input.message.trim(),
    emoji: input.emoji?.trim() || '🎉',
    active: false,
  })
  if (error) return { success: false, error: error.message }
  revalidateOffers()
  return { success: true }
}

export async function updateOffer(
  id: string,
  fields: { message?: string; emoji?: string; active?: boolean },
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('offers').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidateOffers()
  return { success: true }
}

export async function deleteOffer(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('offers').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidateOffers()
  return { success: true }
}
