'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { todayInShopTz } from '@/lib/date'
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

/** Ofertas activas y no vencidas para mostrar en la web pública. Silenciosa si la tabla aún no existe. */
export async function getActiveOffers(): Promise<Offer[]> {
  try {
    const supabase = await createClient()
    const today = todayInShopTz()

    // Intento con filtro de vencimiento en la BD (requiere la columna expires_at, migración 11).
    const withExpiry = await supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .or(`expires_at.is.null,expires_at.gte.${today}`)
      .order('created_at', { ascending: false })
    if (!withExpiry.error && withExpiry.data) return withExpiry.data as Offer[]

    // Fallback si la columna aún no existe: traigo solo las activas y filtro el vencimiento aquí.
    const basic = await supabase
      .from('offers')
      .select('*')
      .eq('active', true)
      .order('created_at', { ascending: false })
    if (basic.error || !basic.data) return []
    return (basic.data as Offer[]).filter((o) => !o.expires_at || o.expires_at >= today)
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

export async function addOffer(input: { message: string; emoji?: string; expires_at?: string | null }): Promise<ActionResult> {
  if (!input.message.trim()) return { success: false, error: 'Escribe el mensaje de la oferta.' }
  const supabase = await createClient()
  const { error } = await supabase.from('offers').insert({
    message: input.message.trim(),
    emoji: input.emoji?.trim() || '🎉',
    active: false,
    expires_at: input.expires_at || null,
  })
  if (error) return { success: false, error: error.message }
  revalidateOffers()
  return { success: true }
}

export async function updateOffer(
  id: string,
  fields: { message?: string; emoji?: string; active?: boolean; expires_at?: string | null },
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
