export type ServiceId = 'bano_mantencion' | 'servicio_completo' | 'bano_comercial'

export const SERVICES: { id: ServiceId; label: string; description: string }[] = [
  {
    id: 'bano_mantencion',
    label: 'Baño con mantención',
    description: 'Baño, secado y cepillado para mantener el pelaje entre peluqueadas.',
  },
  {
    id: 'servicio_completo',
    label: 'Servicio Completo Peluquería',
    description: 'Baño, corte y modelado completo a cargo de nuestro equipo.',
  },
  {
    id: 'bano_comercial',
    label: 'Baño Comercial',
    description: 'Baño estándar rápido y prolijo.',
  },
]

export function serviceLabel(id: ServiceId): string {
  return SERVICES.find((s) => s.id === id)?.label ?? id
}
