'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { BlockedDate } from '@/types'

export async function listBlockedDates(): Promise<BlockedDate[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('blocked_dates')
    .select('*')
    .order('blocked_date', { ascending: true })
  if (error) return []
  return data as BlockedDate[]
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function blockDate(date: string, reason?: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('blocked_dates')
    .insert({ blocked_date: date, reason: reason ?? null })
  if (error) return { success: false, error: 'No se pudo bloquear la fecha (¿ya estaba bloqueada?).' }
  revalidatePath('/admin/dashboard/agenda')
  return { success: true }
}

export async function unblockDate(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('blocked_dates').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/agenda')
  return { success: true }
}
