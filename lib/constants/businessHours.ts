export interface BusinessHours {
  open: string  // 'HH:MM'
  close: string // 'HH:MM'
}

// 0 = domingo ... 6 = sábado (Date.getDay())
// El local abre a las 9:30 de lunes a sábado.
export function businessHoursFor(dayOfWeek: number): BusinessHours | null {
  if (dayOfWeek === 0) return null // domingo: cerrado
  if (dayOfWeek === 6) return { open: '09:30', close: '13:00' } // sábado
  return { open: '09:30', close: '15:00' } // lunes a viernes
}

export const SLOT_INTERVAL_MINUTES = 30
export const MAX_CONCURRENT_DOGS = 3
