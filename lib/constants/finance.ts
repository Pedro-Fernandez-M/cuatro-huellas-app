export type PaymentMethod = 'efectivo' | 'transferencia' | 'tarjeta' | 'otro'

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'tarjeta', label: 'Tarjeta' },
  { id: 'otro', label: 'Otro' },
]

export function paymentMethodLabel(id: string | null | undefined): string {
  if (!id) return 'Sin especificar'
  return PAYMENT_METHODS.find((p) => p.id === id)?.label ?? id
}

// Categorías sugeridas de gasto (el staff puede escribir otras)
export const EXPENSE_CATEGORIES: string[] = [
  'Arriendo',
  'Insumos y productos',
  'Servicios básicos',
  'Sueldos',
  'Transporte',
  'Marketing',
  'Mantención y equipos',
  'Otros',
]
