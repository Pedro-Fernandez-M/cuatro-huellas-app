'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Expense, PaymentMethod } from '@/types'

interface ActionResult {
  success: boolean
  error?: string
}

export async function listExpenses(month: string): Promise<Expense[]> {
  const from = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, '0')}`

  const supabase = await createClient()
  const { data, error } = await supabase
    .from('expenses')
    .select('*')
    .gte('expense_date', from)
    .lte('expense_date', to)
    .order('expense_date', { ascending: false })
  if (error) return []
  return data as Expense[]
}

export async function addExpense(input: {
  amount: number
  category: string
  description?: string
  date: string
  paymentMethod?: PaymentMethod | null
}): Promise<ActionResult> {
  if (!input.amount || input.amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0.' }
  if (!input.category.trim()) return { success: false, error: 'Ingresa una categoría.' }

  const supabase = await createClient()
  const { error } = await supabase.from('expenses').insert({
    amount: input.amount,
    category: input.category.trim(),
    description: input.description?.trim() || null,
    expense_date: input.date,
    payment_method: input.paymentMethod ?? null,
  })
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/contabilidad')
  return { success: true }
}

export async function updateExpense(
  id: string,
  fields: { amount?: number; category?: string; description?: string | null; expense_date?: string; payment_method?: PaymentMethod | null }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/contabilidad')
  return { success: true }
}

export async function deleteExpense(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('expenses').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/contabilidad')
  return { success: true }
}
