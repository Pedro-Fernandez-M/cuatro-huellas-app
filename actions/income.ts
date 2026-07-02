'use server'

import { createClient } from '@/lib/supabase/server'
import { revalidatePath } from 'next/cache'
import type { Appointment, ManualIncome } from '@/types'

export interface IncomeSummary {
  weekTotal: number
  weekCount: number
  monthTotal: number
  monthCount: number
  last8Weeks: { weekStart: string; total: number }[]
}

function startOfWeek(d: Date): Date {
  const date = new Date(d)
  const day = date.getDay() // 0=domingo
  const diff = day === 0 ? -6 : 1 - day // lunes como inicio de semana
  date.setDate(date.getDate() + diff)
  date.setHours(0, 0, 0, 0)
  return date
}

function startOfMonth(d: Date): Date {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

export async function getIncomeSummary(): Promise<IncomeSummary> {
  const supabase = await createClient()
  const now = new Date()
  const weekStart = startOfWeek(now)
  const monthStart = startOfMonth(now)
  const eightWeeksAgo = new Date(weekStart)
  eightWeeksAgo.setDate(eightWeeksAgo.getDate() - 7 * 7)

  const { data, error } = await supabase
    .from('appointments')
    .select('price_charged, departure_time')
    .eq('status', 'completed')
    .not('price_charged', 'is', null)
    .gte('departure_time', eightWeeksAgo.toISOString())

  if (error || !data) {
    return { weekTotal: 0, weekCount: 0, monthTotal: 0, monthCount: 0, last8Weeks: [] }
  }

  let weekTotal = 0
  let weekCount = 0
  let monthTotal = 0
  let monthCount = 0
  const weekBuckets = new Map<string, number>()

  for (const row of data) {
    const price = Number(row.price_charged) || 0
    const departedAt = row.departure_time ? new Date(row.departure_time) : null
    if (!departedAt) continue

    if (departedAt >= weekStart) {
      weekTotal += price
      weekCount++
    }
    if (departedAt >= monthStart) {
      monthTotal += price
      monthCount++
    }

    const bucketStart = startOfWeek(departedAt).toISOString().slice(0, 10)
    weekBuckets.set(bucketStart, (weekBuckets.get(bucketStart) ?? 0) + price)
  }

  const last8Weeks = Array.from(weekBuckets.entries())
    .map(([weekStart, total]) => ({ weekStart, total }))
    .sort((a, b) => a.weekStart.localeCompare(b.weekStart))
    .slice(-8)

  return { weekTotal, weekCount, monthTotal, monthCount, last8Weeks }
}

// ─── Ingresos por mes: citas completadas + ingresos manuales ───────────

export interface MonthIncome {
  appointments: Appointment[]
  manuals: ManualIncome[]
  total: number
}

export async function getMonthIncome(month: string): Promise<MonthIncome> {
  // month: 'YYYY-MM'
  const from = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, '0')}`

  const supabase = await createClient()
  const [apptRes, manualRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('status', 'completed')
      .not('price_charged', 'is', null)
      .gte('appointment_date', from)
      .lte('appointment_date', to)
      .order('appointment_date', { ascending: false })
      .order('start_time', { ascending: false }),
    supabase
      .from('manual_incomes')
      .select('*')
      .gte('income_date', from)
      .lte('income_date', to)
      .order('income_date', { ascending: false }),
  ])

  const appointments = (apptRes.data ?? []) as Appointment[]
  const manuals = (manualRes.data ?? []) as ManualIncome[]
  const total =
    appointments.reduce((s, a) => s + (Number(a.price_charged) || 0), 0) +
    manuals.reduce((s, mi) => s + (Number(mi.amount) || 0), 0)

  return { appointments, manuals, total }
}

interface ActionResult {
  success: boolean
  error?: string
}

export async function updateAppointmentPrice(
  id: string,
  price: number | null,
  paymentMethod?: string | null
): Promise<ActionResult> {
  const supabase = await createClient()
  const fields: Record<string, unknown> = { price_charged: price, updated_at: new Date().toISOString() }
  if (paymentMethod !== undefined) fields.payment_method = paymentMethod
  const { error } = await supabase.from('appointments').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/ingresos')
  revalidatePath('/admin/dashboard/contabilidad')
  return { success: true }
}

export async function addManualIncome(
  amount: number,
  date: string,
  description?: string,
  paymentMethod?: string | null
): Promise<ActionResult> {
  if (!amount || amount <= 0) return { success: false, error: 'El monto debe ser mayor a 0.' }
  const supabase = await createClient()
  const { error } = await supabase
    .from('manual_incomes')
    .insert({ amount, income_date: date, description: description?.trim() || null, payment_method: paymentMethod ?? null })
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/ingresos')
  revalidatePath('/admin/dashboard/contabilidad')
  return { success: true }
}

export async function updateManualIncome(
  id: string,
  fields: { amount?: number; income_date?: string; description?: string | null; payment_method?: string | null }
): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('manual_incomes').update(fields).eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/ingresos')
  revalidatePath('/admin/dashboard/contabilidad')
  return { success: true }
}

export async function deleteManualIncome(id: string): Promise<ActionResult> {
  const supabase = await createClient()
  const { error } = await supabase.from('manual_incomes').delete().eq('id', id)
  if (error) return { success: false, error: error.message }
  revalidatePath('/admin/dashboard/ingresos')
  return { success: true }
}
