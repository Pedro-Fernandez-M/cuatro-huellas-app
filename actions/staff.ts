'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Staff, PublicStaff, StaffRole } from '@/types'

/** Lista pública (sin email) de las funcionarias activas, para la web de reservas. */
export async function getActiveStaff(): Promise<PublicStaff[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.rpc('get_active_staff')
    if (error || !data) return []
    return data as PublicStaff[]
  } catch {
    return []
  }
}

/** La funcionaria logueada (según su email de sesión). Null si no hay sesión o no está en staff. */
export async function getCurrentStaff(): Promise<Staff | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user?.email) return null
    const { data, error } = await supabase.from('staff').select('*').eq('email', user.email).maybeSingle()
    if (error || !data) return null
    return data as Staff
  } catch {
    return null
  }
}

/** true si la funcionaria logueada es admin (Isabel). */
export async function isCurrentUserAdmin(): Promise<boolean> {
  const staff = await getCurrentStaff()
  return staff?.role === 'admin'
}

/** Todas las funcionarias (solo admin las gestiona). */
export async function getAllStaff(): Promise<Staff[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('staff').select('*').order('sort_order', { ascending: true })
    if (error || !data) return []
    return data as Staff[]
  } catch {
    return []
  }
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function updateStaff(
  id: string,
  fields: { name?: string; role?: StaffRole; active?: boolean; photo_url?: string | null; sort_order?: number },
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('staff').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/reservar')
  revalidatePath('/admin/dashboard/equipo')
  return { success: true }
}
