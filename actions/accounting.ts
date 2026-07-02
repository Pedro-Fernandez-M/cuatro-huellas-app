'use server'

import { createClient } from '@/lib/supabase/server'
import { serviceLabel } from '@/lib/constants/services'
import { paymentMethodLabel, cardCommission } from '@/lib/constants/finance'
import type { Appointment, ManualIncome, Expense } from '@/types'

function monthRange(month: string) {
  const from = `${month}-01`
  const [y, m] = month.split('-').map(Number)
  const lastDay = new Date(y, m, 0).getDate()
  const to = `${month}-${String(lastDay).padStart(2, '0')}`
  return { from, to }
}

export interface AccountingData {
  month: string
  incomeTotal: number       // bruto (lo que pagó el cliente)
  commissionTotal: number   // comisiones de tarjeta
  netIncomeTotal: number    // lo que realmente recibió el local
  expenseTotal: number
  profit: number            // netIncome − gastos
  incomeByMethod: { method: string; total: number }[]
  incomeByService: { service: string; total: number }[]
  expenseByCategory: { category: string; total: number }[]
  appointments: Appointment[]
  manuals: ManualIncome[]
  expenses: Expense[]
}

export async function getAccountingData(month: string): Promise<AccountingData> {
  const { from, to } = monthRange(month)
  const supabase = await createClient()

  const [apptRes, manualRes, expenseRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('*')
      .eq('status', 'completed')
      .not('price_charged', 'is', null)
      .gte('appointment_date', from)
      .lte('appointment_date', to),
    supabase.from('manual_incomes').select('*').gte('income_date', from).lte('income_date', to),
    supabase.from('expenses').select('*').gte('expense_date', from).lte('expense_date', to),
  ])

  const appointments = (apptRes.data ?? []) as Appointment[]
  const manuals = (manualRes.data ?? []) as ManualIncome[]
  const expenses = (expenseRes.data ?? []) as Expense[]

  const incomeTotal =
    appointments.reduce((s, a) => s + (Number(a.price_charged) || 0), 0) +
    manuals.reduce((s, m) => s + (Number(m.amount) || 0), 0)
  const commissionTotal =
    appointments.reduce((s, a) => s + cardCommission(Number(a.price_charged) || 0, a.payment_method), 0) +
    manuals.reduce((s, m) => s + cardCommission(Number(m.amount) || 0, m.payment_method), 0)
  const netIncomeTotal = incomeTotal - commissionTotal
  const expenseTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  // Ingresos por método de pago (citas + manuales)
  const methodMap = new Map<string, number>()
  for (const a of appointments) {
    const k = paymentMethodLabel(a.payment_method)
    methodMap.set(k, (methodMap.get(k) ?? 0) + (Number(a.price_charged) || 0))
  }
  for (const m of manuals) {
    const k = paymentMethodLabel(m.payment_method)
    methodMap.set(k, (methodMap.get(k) ?? 0) + (Number(m.amount) || 0))
  }

  // Ingresos por servicio (solo citas)
  const serviceMap = new Map<string, number>()
  for (const a of appointments) {
    const k = serviceLabel(a.service)
    serviceMap.set(k, (serviceMap.get(k) ?? 0) + (Number(a.price_charged) || 0))
  }
  if (manuals.length > 0) {
    serviceMap.set('Otros ingresos', manuals.reduce((s, m) => s + (Number(m.amount) || 0), 0))
  }

  // Gastos por categoría
  const catMap = new Map<string, number>()
  for (const e of expenses) {
    catMap.set(e.category, (catMap.get(e.category) ?? 0) + (Number(e.amount) || 0))
  }

  const sortDesc = (a: { total: number }, b: { total: number }) => b.total - a.total

  return {
    month,
    incomeTotal,
    commissionTotal,
    netIncomeTotal,
    expenseTotal,
    profit: netIncomeTotal - expenseTotal,
    incomeByMethod: Array.from(methodMap.entries()).map(([method, total]) => ({ method, total })).sort(sortDesc),
    incomeByService: Array.from(serviceMap.entries()).map(([service, total]) => ({ service, total })).sort(sortDesc),
    expenseByCategory: Array.from(catMap.entries()).map(([category, total]) => ({ category, total })).sort(sortDesc),
    appointments,
    manuals,
    expenses,
  }
}

export interface CashClose {
  date: string
  byMethod: { method: string; total: number }[]
  incomeTotal: number
  commissionTotal: number
  netIncomeTotal: number
  expenseTotal: number
  net: number
}

export async function getCashClose(date: string): Promise<CashClose> {
  const supabase = await createClient()
  const [apptRes, manualRes, expenseRes] = await Promise.all([
    supabase
      .from('appointments')
      .select('price_charged, payment_method')
      .eq('status', 'completed')
      .not('price_charged', 'is', null)
      .eq('appointment_date', date),
    supabase.from('manual_incomes').select('amount, payment_method').eq('income_date', date),
    supabase.from('expenses').select('amount').eq('expense_date', date),
  ])

  const appts = apptRes.data ?? []
  const manuals = manualRes.data ?? []
  const expenses = expenseRes.data ?? []

  const methodMap = new Map<string, number>()
  let commissionTotal = 0
  for (const a of appts) {
    const amt = Number(a.price_charged) || 0
    const k = paymentMethodLabel(a.payment_method as string | null)
    methodMap.set(k, (methodMap.get(k) ?? 0) + amt)
    commissionTotal += cardCommission(amt, a.payment_method as string | null)
  }
  for (const m of manuals) {
    const amt = Number(m.amount) || 0
    const k = paymentMethodLabel(m.payment_method as string | null)
    methodMap.set(k, (methodMap.get(k) ?? 0) + amt)
    commissionTotal += cardCommission(amt, m.payment_method as string | null)
  }

  const incomeTotal = Array.from(methodMap.values()).reduce((s, v) => s + v, 0)
  const netIncomeTotal = incomeTotal - commissionTotal
  const expenseTotal = expenses.reduce((s, e) => s + (Number(e.amount) || 0), 0)

  return {
    date,
    byMethod: Array.from(methodMap.entries()).map(([method, total]) => ({ method, total })).sort((a, b) => b.total - a.total),
    incomeTotal,
    commissionTotal,
    netIncomeTotal,
    expenseTotal,
    net: netIncomeTotal - expenseTotal,
  }
}
