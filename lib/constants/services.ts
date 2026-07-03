export type ServiceId = 'bano_mantencion' | 'servicio_completo' | 'bano_comercial' | 'deslanado'

export const SERVICES: { id: ServiceId; label: string; description: string; includes?: string[] }[] = [
  {
    id: 'bano_mantencion',
    label: 'Baño con mantención',
    description:
      'Mantiene la higiene y el pelaje en óptimo estado: se retoca la carita, se cepilla el pelaje completo, redondeo de patas y despeje sanitario.',
    includes: ['Retoque de carita', 'Cepillado completo', 'Redondeo de patas', 'Despeje sanitario'],
  },
  {
    id: 'servicio_completo',
    label: 'Servicio Completo Peluquería',
    description: 'Corte y modelado completo según la raza o tu preferencia.',
    includes: [
      'Baño desmugrante',
      'Corte de pelo según raza o preferencia',
      'Cepillado',
      'Corte de uñas',
      'Limpieza de oídos',
      'Despeje de cojinetes',
    ],
  },
  {
    id: 'bano_comercial',
    label: 'Baño Comercial',
    description: 'Baño estándar rápido y prolijo para tu mascota.',
  },
  {
    id: 'deslanado',
    label: 'Deslanado (mantos de doble capa)',
    description:
      'Retira el pelo muerto de la capa interna (subpelo) sin cortar el manto externo. Ideal para razas de doble capa.',
    includes: [
      'Baño desmugrante',
      'Baño cosmético',
      'Deslanado',
      'Corte de uñas',
      'Limpieza de oídos',
      'Despeje de cojinetes',
      'Despeje sanitario',
    ],
  },
]

export function serviceLabel(id: string): string {
  return SERVICES.find((s) => s.id === id)?.label ?? id
}
