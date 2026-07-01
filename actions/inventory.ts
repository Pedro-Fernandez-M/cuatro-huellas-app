'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { InventoryProduct, InventoryMovement, InventoryCategory } from '@/types'

export async function listProducts(): Promise<InventoryProduct[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_products')
    .select('*')
    .order('category', { ascending: true })
    .order('display_name', { ascending: true })
  if (error) return []
  return data as InventoryProduct[]
}

export async function listMovements(limit = 50): Promise<InventoryMovement[]> {
  const supabase = await createClient()
  const { data, error } = await supabase
    .from('inventory_movements')
    .select('*, product:inventory_products(*)')
    .order('created_at', { ascending: false })
    .limit(limit)
  if (error) return []
  return data as unknown as InventoryMovement[]
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function adjustStock(
  productId: string,
  type: 'in' | 'out',
  quantity: number,
  note?: string
): Promise<ActionResult> {
  if (quantity <= 0) return { success: false, error: 'La cantidad debe ser mayor a 0.' }

  const supabase = await createClient()
  const { error } = await supabase.rpc('record_inventory_movement', {
    p_product_id: productId,
    p_type: type,
    p_quantity: quantity,
    p_note: note ?? null,
  })

  if (error) {
    if (error.message?.includes('STOCK_INSUFICIENTE')) {
      return { success: false, error: 'No hay suficiente stock para esa salida.' }
    }
    return { success: false, error: 'No se pudo registrar el movimiento.' }
  }

  revalidatePath('/admin/dashboard/inventario')
  return { success: true }
}

export async function createProduct(
  category: InventoryCategory,
  displayName: string,
  variant?: string,
  initialStock = 0
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('inventory_products').insert({
    category,
    variant: variant ?? null,
    display_name: displayName,
    current_stock: initialStock,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/inventario')
  return { success: true }
}

export async function deleteProduct(productId: string): Promise<ActionResult> {
  const supabase = await createClient()
  // El borrado elimina también su historial de movimientos (ON DELETE CASCADE en la BD).
  const { error } = await supabase.from('inventory_products').delete().eq('id', productId)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/inventario')
  return { success: true }
}
