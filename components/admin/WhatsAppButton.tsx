'use client'

import { MessageCircle } from 'lucide-react'
import type { Appointment } from '@/types'
import { waLink, buildReminderMessage } from '@/lib/whatsapp'
import { cn } from '@/lib/utils'

/**
 * Abre WhatsApp con el recordatorio de la cita ya escrito, listo para enviar
 * al dueño de la mascota. No envía nada solo: el staff aprieta enviar.
 */
export function WhatsAppButton({
  appointment,
  size = 'sm',
  className,
}: {
  appointment: Appointment
  size?: 'sm' | 'md'
  className?: string
}) {
  const href = waLink(appointment.owner_phone, buildReminderMessage(appointment))
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'inline-flex items-center justify-center gap-1.5 rounded-lg font-semibold text-white transition-all hover:opacity-90',
        size === 'sm' ? 'h-9 px-3 text-xs' : 'h-11 px-5 text-sm',
        className
      )}
      style={{ backgroundColor: '#25D366' }}
      title="Enviar recordatorio por WhatsApp"
    >
      <MessageCircle className="size-4" />
      WhatsApp
    </a>
  )
}
