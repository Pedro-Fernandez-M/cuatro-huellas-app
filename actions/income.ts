'use server'

import { createClient } from '@/lib/supabase/server'

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
