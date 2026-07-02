export type SizeCategory = 'pequena' | 'mediana' | 'grande' | 'extra_grande'

export const SIZES: { id: SizeCategory; label: string; weightRange: string; durationMinutes: number; price: number }[] = [
  { id: 'pequena', label: 'Pequeña', weightRange: '0 – 21 kg', durationMinutes: 180, price: 21000 },
  { id: 'mediana', label: 'Mediana', weightRange: '22 – 34 kg', durationMinutes: 180, price: 24000 },
  { id: 'grande', label: 'Grande', weightRange: '35 – 80 kg', durationMinutes: 360, price: 35000 },
  { id: 'extra_grande', label: 'Extra Grande', weightRange: '80+ kg', durationMinutes: 360, price: 70000 },
]

export function sizeBasePrice(id: SizeCategory): number {
  return SIZES.find((s) => s.id === id)?.price ?? 0
}

// Perros que solo se agendan durante la mañana (su servicio dura ~6h)
export const MORNING_ONLY_SIZES: SizeCategory[] = ['grande', 'extra_grande']

export function sizeLabel(id: SizeCategory): string {
  return SIZES.find((s) => s.id === id)?.label ?? id
}

export function durationForSize(id: SizeCategory): number {
  return SIZES.find((s) => s.id === id)?.durationMinutes ?? 180
}

export function isMorningOnly(id: SizeCategory): boolean {
  return MORNING_ONLY_SIZES.includes(id)
}
