'use server'

import { createClient } from '@/lib/supabase/server'
import { serviceLabel } from '@/lib/constants/services'
import { sizeLabel } from '@/lib/constants/sizes'
import { cardCommission } from '@/lib/constants/finance'
import type { Appointment, Expense, ManualIncome } from '@/types'

const WEEKDAY_NAMES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado']

function monthRange(month: string) {
  const from = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  return { from, to: `${month}-${String(lastDay).padStart(2, '0')}` }
}

function ymd(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export interface DashboardData {
  month: string
  // Totales del mes
  visits: number
  income: number          // neto (después de comisiones)
  expenses: number
  profit: number
  avgTicket: number
  noShows: number
  cancelled: number
  // Semana en curso
  weekVisits: number
  weekIncome: number
  // Distribuciones
  byWeekday: { day: string; visits: number }[]
  byService: { label: string; visits: number }[]
  bySize: { label: string; visits: number }[]
  perDay: { date: string; visits: number; income: number }[]
  // Clientes
  newClients: number
  totalClients: number
  frequentClients: { name: string; phone: string; visits: number; total: number }[]
  // Inventario con poco stock
  lowStock: { name: string; stock: number; unit: string }[]
}

export async function getDashboardData(month: string): Promise<DashboardData> {
  const { from, to } = monthRange(month)
  const supabase = await createClient()

  // Semana en curso (lunes a domingo)
  const now = new Date()
  const dow = now.getDay()
  const weekStart = new Date(now)
  weekStart.setDate(now.getDate() + (dow === 0 ? -6 : 1 - dow))
  const weekFrom = ymd(weekStart)
  const weekTo = ymd(now)

  const [apptRes, expRes, manualRes, clientsRes, stockRes] = await Promise.all([
    supabase.from('appointments').select('*').gte('appointment_date', from).lte('appointment_date', to),
    supabase.from('expenses').select('*').gte('expense_date', from).lte('expense_date', to),
    supabase.from('manual_incomes').select('*').gte('income_date', from).lte('income_date', to),
    supabase.from('clients').select('id, owner_name, owner_phone, created_at'),
    supabase.from('inventory_products').select('display_name, current_stock, unit, doses_per_container'),
  ])

  const appts = (apptRes.data ?? []) as Appointment[]
  const expensesRows = (expRes.data ?? []) as Expense[]
  const manuals = (manualRes.data ?? []) as ManualIncome[]
  const clients = (clientsRes.data ?? []) as { id: string; owner_name: string; owner_phone: string; created_at: string }[]

  const completed = appts.filter((a) => a.status === 'completed')
  const noShows = appts.filter((a) => a.status === 'no_show').length
  const cancelled = appts.filter((a) => a.status === 'cancelled').length

  const grossAppt = completed.reduce((s, a) => s + (Number(a.price_charged) || 0), 0)
  const grossManual = manuals.reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const commissions =
    completed.reduce((s, a) => s + cardCommission(Number(a.price_charged) || 0, a.payment_method), 0) +
    manuals.reduce((s, m) => s + cardCommission(Number(m.amount) || 0, m.payment_method), 0)
  const income = grossAppt + grossManual - commissions
  const expensesTotal = expensesRows.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  // Semana en curso
  const weekAppts = completed.filter((a) => a.appointment_date >= weekFrom && a.appointment_date <= weekTo)
  const weekIncome = weekAppts.reduce((s, a) => s + (Number(a.price_charged) || 0), 0)

  // Por día de la semana
  const weekdayMap = new Map<number, number>()
  for (const a of completed) {
    const [y, m, d] = a.appointment_date.split('-').map(Number)
    const day = new Date(y, m - 1, d).getDay()
    weekdayMap.set(day, (weekdayMap.get(day) ?? 0) + 1)
  }
  const byWeekday = [1, 2, 3, 4, 5, 6, 0].map((d) => ({ day: WEEKDAY_NAMES[d], visits: weekdayMap.get(d) ?? 0 }))

  // Por servicio y tamaño
  const svcMap = new Map<string, number>()
  const sizeMap = new Map<string, number>()
  for (const a of completed) {
    const sl = serviceLabel(a.service)
    svcMap.set(sl, (svcMap.get(sl) ?? 0) + 1)
    const zl = sizeLabel(a.size_category)
    sizeMap.set(zl, (sizeMap.get(zl) ?? 0) + 1)
  }

  // Por día del mes
  const dayMap = new Map<string, { visits: number; income: number }>()
  for (const a of completed) {
    const cur = dayMap.get(a.appointment_date) ?? { visits: 0, income: 0 }
    cur.visits += 1
    cur.income += Number(a.price_charged) || 0
    dayMap.set(a.appointment_date, cur)
  }

  // Clientes nuevos del mes
  const newClients = clients.filter((c) => (c.created_at ?? '').slice(0, 10) >= from && (c.created_at ?? '').slice(0, 10) <= to).length

  // Clientes frecuentes (histórico por teléfono, usando las citas del mes consultado + completadas)
  const { data: allCompleted } = await supabase
    .from('appointments')
    .select('owner_name, owner_phone, price_charged, status')
    .eq('status', 'completed')
  const freqMap = new Map<string, { name: string; phone: string; visits: number; total: number }>()
  for (const a of (allCompleted ?? []) as { owner_name: string; owner_phone: string; price_charged: number | null }[]) {
    const key = a.owner_phone
    const cur = freqMap.get(key) ?? { name: a.owner_name, phone: a.owner_phone, visits: 0, total: 0 }
    cur.visits += 1
    cur.total += Number(a.price_charged) || 0
    freqMap.set(key, cur)
  }
  const frequentClients = Array.from(freqMap.values()).sort((a, b) => b.visits - a.visits).slice(0, 8)

  // Stock bajo
  const lowStock = ((stockRes.data ?? []) as { display_name: string; current_stock: number; unit: string; doses_per_container: number | null }[])
    .filter((p) => {
      const threshold = p.doses_per_container ? p.doses_per_container * 0.25 : 3
      return p.current_stock <= threshold
    })
    .map((p) => ({ name: p.display_name, stock: p.current_stock, unit: p.unit }))
    .sort((a, b) => a.stock - b.stock)
    .slice(0, 8)

  return {
    month,
    visits: completed.length,
    income,
    expenses: expensesTotal,
    profit: income - expensesTotal,
    avgTicket: completed.length ? Math.round(grossAppt / completed.length) : 0,
    noShows,
    cancelled,
    weekVisits: weekAppts.length,
    weekIncome,
    byWeekday,
    byService: Array.from(svcMap.entries()).map(([label, visits]) => ({ label, visits })).sort((a, b) => b.visits - a.visits),
    bySize: Array.from(sizeMap.entries()).map(([label, visits]) => ({ label, visits })).sort((a, b) => b.visits - a.visits),
    perDay: Array.from(dayMap.entries()).map(([date, v]) => ({ date, ...v })).sort((a, b) => a.date.localeCompare(b.date)),
    newClients,
    totalClients: clients.length,
    frequentClients,
    lowStock,
  }
}
