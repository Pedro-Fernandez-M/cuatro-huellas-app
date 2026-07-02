export type PaymentMethod = 'efectivo' | 'transferencia' | 'debito' | 'credito' | 'prepago' | 'otro'

export const PAYMENT_METHODS: { id: PaymentMethod; label: string }[] = [
  { id: 'efectivo', label: 'Efectivo' },
  { id: 'transferencia', label: 'Transferencia' },
  { id: 'debito', label: 'Débito' },
  { id: 'credito', label: 'Crédito' },
  { id: 'prepago', label: 'Prepago' },
  { id: 'otro', label: 'Otro' },
]

export function paymentMethodLabel(id: string | null | undefined): string {
  if (!id) return 'Sin especificar'
  return PAYMENT_METHODS.find((p) => p.id === id)?.label ?? id
}

// ─── Comisiones de la máquina de tarjeta (Compraquí) ───────────────
// Tasa neta de comisión (sin IVA). Se le aplica IVA aparte (ver IVA).
// Ajusta estos valores si tu proveedor cambia las tarifas.
export const CARD_FEES: Partial<Record<PaymentMethod, number>> = {
  debito: 0.0129,   // 1,29% + IVA
  credito: 0.0159,  // 1,59% + IVA
  prepago: 0.0144,  // 1,44% + IVA
}

export const IVA = 0.19

export function isCardMethod(method: string | null | undefined): boolean {
  return method === 'debito' || method === 'credito' || method === 'prepago'
}

/** Comisión (con IVA) que cobra la máquina por un pago con tarjeta. 0 si es efectivo/transferencia. */
export function cardCommission(amount: number, method: string | null | undefined): number {
  const rate = method ? CARD_FEES[method as PaymentMethod] : undefined
  if (!rate) return 0
  return Math.round(amount * rate * (1 + IVA))
}

/** Monto que realmente recibe el local después de la comisión de tarjeta. */
export function netReceived(amount: number, method: string | null | undefined): number {
  return amount - cardCommission(amount, method)
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
  'Comisiones tarjeta',
  'Otros',
]
