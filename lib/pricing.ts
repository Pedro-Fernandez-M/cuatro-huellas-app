import { sizeBasePrice, type SizeCategory } from '@/lib/constants/sizes'
import { addonPrice, coatConditionPrice, type AddonId, type CoatCondition } from '@/lib/constants/addons'

type PriceMap = Record<string, number>

interface EstimateParams {
  sizeCategory: SizeCategory
  addons: AddonId[]
  coatCondition: CoatCondition | null
}

/**
 * Valor estimativo: precio base por tamaño + extras + recargo por pelaje en mal
 * estado. Es referencial; el valor final lo confirma el local en la atención.
 * Si se pasa un mapa de precios (desde la BD) se usa ese; si no, cae a las constantes.
 */
export function estimateTotal(params: EstimateParams, prices?: PriceMap): number {
  const base = prices?.[`size_${params.sizeCategory}`] ?? sizeBasePrice(params.sizeCategory)
  const extras = params.addons.reduce((sum, a) => sum + (prices?.[`addon_${a}`] ?? addonPrice(a)), 0)
  const coat = params.coatCondition
    ? (prices?.[`coat_${params.coatCondition}`] ?? coatConditionPrice(params.coatCondition))
    : 0
  return base + extras + coat
}
