const SHOP_TIMEZONE = 'America/Santiago'

/** Fecha de "hoy" en la zona horaria del local (no la del servidor), formato YYYY-MM-DD. */
export function todayInShopTz(): string {
  return new Intl.DateTimeFormat('en-CA', { timeZone: SHOP_TIMEZONE }).format(new Date())
}

export function formatDateLong(dateStr: string): string {
  const [y, m, d] = dateStr.split('-').map(Number)
  return new Date(y, m - 1, d).toLocaleDateString('es-CL', { weekday: 'long', day: 'numeric', month: 'long' })
}

export function formatCLP(amount: number | null | undefined): string {
  if (amount === null || amount === undefined) return '—'
  return `$${Math.round(amount).toLocaleString('es-CL')}`
}

/** Input datetime-local (hora del navegador) a partir de un ISO string, para prellenar formularios. */
export function toDateTimeLocalValue(iso: string | null): string {
  if (!iso) return ''
  const d = new Date(iso)
  const pad = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`
}
