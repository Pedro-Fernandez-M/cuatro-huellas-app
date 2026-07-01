export type AddonId = 'lavado_dientes' | 'manicure_patas' | 'despeje_sanitario'

export const ADDONS: { id: AddonId; label: string }[] = [
  { id: 'lavado_dientes', label: 'Lavado de dientes' },
  { id: 'manicure_patas', label: 'Manicure de patas' },
  { id: 'despeje_sanitario', label: 'Despeje sanitario' },
]

export type CoatCondition = 'mucho_nudo' | 'mal_estado' | 'solamente_sucio' | 'apelmazado'

export const COAT_CONDITIONS: { id: CoatCondition; label: string }[] = [
  { id: 'mucho_nudo', label: 'Mucho nudo' },
  { id: 'mal_estado', label: 'Mal estado' },
  { id: 'solamente_sucio', label: 'Solamente sucio' },
  { id: 'apelmazado', label: 'Apelmazado' },
]

export function addonLabel(id: AddonId): string {
  return ADDONS.find((a) => a.id === id)?.label ?? id
}

export function coatConditionLabel(id: CoatCondition): string {
  return COAT_CONDITIONS.find((c) => c.id === id)?.label ?? id
}
