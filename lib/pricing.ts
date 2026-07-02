import { sizeBasePrice, type SizeCategory } from '@/lib/constants/sizes'
import { addonPrice, coatConditionPrice, type AddonId, type CoatCondition } from '@/lib/constants/addons'

/**
 * Valor estimativo de un servicio: precio base por tamaño + extras seleccionados
 * + recargo por pelaje en mal estado. Es referencial; el valor final lo confirma
 * el local al momento de la atención.
 */
export function estimateTotal(params: {
  sizeCategory: SizeCategory
  addons: AddonId[]
  coatCondition: CoatCondition | null
}): number {
  const base = sizeBasePrice(params.sizeCategory)
  const extras = params.addons.reduce((sum, a) => sum + addonPrice(a), 0)
  const coat = coatConditionPrice(params.coatCondition)
  return base + extras + coat
}
