'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import { SERVICES } from '@/lib/constants/services'
import { SIZES } from '@/lib/constants/sizes'
import { ADDONS, COAT_CONDITIONS } from '@/lib/constants/addons'
import type { Service } from '@/types'

export type PriceMap = Record<string, number>

// Precios por defecto (desde las constantes) — se usan si la tabla `pricing` aún no existe.
function defaultPriceMap(): PriceMap {
  const map: PriceMap = {}
  for (const s of SIZES) map[`size_${s.id}`] = s.price
  for (const a of ADDONS) map[`addon_${a.id}`] = a.price
  for (const c of COAT_CONDITIONS) if (c.price > 0) map[`coat_${c.id}`] = c.price
  return map
}

function defaultServices(): Service[] {
  return SERVICES.map((s, i) => ({
    id: s.id,
    name: s.label,
    description: s.description,
    includes: s.includes ?? [],
    active: true,
    sort_order: i + 1,
  }))
}

export interface Catalog {
  services: Service[]
  prices: PriceMap
}

/** Servicios activos + mapa de precios. Cae a las constantes si las tablas aún no existen. */
export async function getCatalog(): Promise<Catalog> {
  try {
    const supabase = await createClient()
    const [svcRes, priceRes] = await Promise.all([
      supabase.from('services').select('*').eq('active', true).order('sort_order', { ascending: true }),
      supabase.from('pricing').select('key, amount'),
    ])

    if (svcRes.error || priceRes.error || !svcRes.data || svcRes.data.length === 0) {
      return { services: defaultServices(), prices: defaultPriceMap() }
    }

    const prices: PriceMap = { ...defaultPriceMap() }
    for (const p of priceRes.data ?? []) prices[p.key as string] = Number(p.amount) || 0

    return { services: svcRes.data as Service[], prices }
  } catch {
    return { services: defaultServices(), prices: defaultPriceMap() }
  }
}

/** Todos los servicios (incluye inactivos) para el panel admin. */
export async function getAllServices(): Promise<Service[]> {
  try {
    const supabase = await createClient()
    const { data, error } = await supabase.from('services').select('*').order('sort_order', { ascending: true })
    if (error || !data || data.length === 0) return defaultServices()
    return data as Service[]
  } catch {
    return defaultServices()
  }
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function updatePrice(key: string, amount: number): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase
    .from('pricing')
    .upsert({ key, amount, updated_at: new Date().toISOString() }, { onConflict: 'key' })
  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/reservar')
  revalidatePath('/admin/dashboard/servicios')
  return { success: true }
}

function slugify(name: string): string {
  return name.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '_').replace(/^_+|_+$/g, '').slice(0, 40) || `serv_${Date.now()}`
}

export async function addService(input: { name: string; description?: string; includes?: string[] }): Promise<ActionResult> {
  if (!input.name.trim()) return { success: false, error: 'Ingresa un nombre.' }
  const supabase = await createClient()
  const { data: existing } = await supabase.from('services').select('sort_order').order('sort_order', { ascending: false }).limit(1)
  const nextOrder = ((existing?.[0]?.sort_order as number) ?? 0) + 1

  let id = slugify(input.name)
  // Evitar colisión de id
  const { data: clash } = await supabase.from('services').select('id').eq('id', id).maybeSingle()
  if (clash) id = `${id}_${Date.now().toString().slice(-4)}`

  const { error } = await supabase.from('services').insert({
    id,
    name: input.name.trim(),
    description: input.description?.trim() || null,
    includes: input.includes ?? [],
    sort_order: nextOrder,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/reservar')
  revalidatePath('/admin/dashboard/servicios')
  return { success: true }
}

export async function updateService(
  id: string,
  fields: { name?: string; description?: string | null; includes?: string[]; active?: boolean }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('services').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/reservar')
  revalidatePath('/admin/dashboard/servicios')
  return { success: true }
}

export async function deleteService(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('services').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/')
  revalidatePath('/reservar')
  revalidatePath('/admin/dashboard/servicios')
  return { success: true }
}
