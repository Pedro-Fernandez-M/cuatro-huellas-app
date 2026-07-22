export type AddonId = 'lavado_dientes' | 'pintado_unas' | 'retiro_feca' | 'masticable_pulgas'

export const ADDONS: { id: AddonId; label: string; price: number; from?: boolean }[] = [
  { id: 'lavado_dientes', label: 'Lavado de dientes', price: 4000 },
  { id: 'pintado_unas', label: 'Pintado de uñas', price: 3000 },
  { id: 'retiro_feca', label: 'Retiro de feca', price: 5000 },
  { id: 'masticable_pulgas', label: 'Masticable para pulgas', price: 6500, from: true },
]

export function addonLabel(id: AddonId): string {
  return ADDONS.find((a) => a.id === id)?.label ?? id
}

export function addonPrice(id: AddonId): number {
  return ADDONS.find((a) => a.id === id)?.price ?? 0
}

export type CoatCondition = 'mucho_nudo' | 'mal_estado' | 'solamente_sucio' | 'apelmazado'

// Recargo por condición del pelaje. Mucho nudo, mal estado y apelmazado suman $7.000.
// "Solamente sucio" no tiene costo: está incluido en el servicio.
export const COAT_CONDITIONS: { id: CoatCondition; label: string; price: number; included?: boolean }[] = [
  { id: 'mucho_nudo', label: 'Mucho nudo', price: 7000 },
  { id: 'mal_estado', label: 'Pelaje en mal estado', price: 7000 },
  { id: 'solamente_sucio', label: 'Solamente sucio', price: 0, included: true },
  { id: 'apelmazado', label: 'Apelmazado', price: 7000 },
]

export function coatConditionLabel(id: CoatCondition): string {
  return COAT_CONDITIONS.find((c) => c.id === id)?.label ?? id
}

export function coatConditionPrice(id: CoatCondition | null): number {
  if (!id) return 0
  return COAT_CONDITIONS.find((c) => c.id === id)?.price ?? 0
}
