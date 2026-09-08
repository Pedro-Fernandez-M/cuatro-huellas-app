/**
 * Fechas laborales desde HOY hasta el sábado de esta semana (excluye domingo).
 * Se cuenta solo lo que queda por delante — los días ya pasados no sirven.
 */
export function workDatesThisWeek(today: string): string[] {
  const [y, m, d] = today.split('-').map(Number)
  const dow = new Date(y, m - 1, d).getDay() // 0=dom ... 6=sáb
  if (dow === 0) return [] // domingo: la semana laboral ya terminó
  const untilSaturday = 6 - dow
  const out: string[] = []
  for (let i = 0; i <= untilSaturday; i++) {
    const dt = new Date(y, m - 1, d + i)
    out.push(`${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, '0')}-${String(dt.getDate()).padStart(2, '0')}`)
  }
  return out
}
