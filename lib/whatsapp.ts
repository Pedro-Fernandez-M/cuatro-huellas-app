import { serviceLabel } from '@/lib/constants/services'
import { formatDateLong } from '@/lib/date'
import type { Appointment } from '@/types'

/**
 * Normaliza un teléfono chileno a formato internacional para wa.me
 * (solo dígitos, con código país 56). Acepta formatos como
 * "+56 9 1234 5678", "9 1234 5678", "912345678", etc.
 */
export function normalizePhoneCL(raw: string): string {
  const digits = raw.replace(/\D/g, '')
  if (digits.startsWith('56')) return digits
  if (digits.length === 9 && digits.startsWith('9')) return '56' + digits
  if (digits.length === 8) return '569' + digits
  return digits
}

/** Enlace wa.me que abre WhatsApp con el mensaje ya escrito. */
export function waLink(phone: string, message: string): string {
  return `https://wa.me/${normalizePhoneCL(phone)}?text=${encodeURIComponent(message)}`
}

/** Mensaje de recordatorio/confirmación de una cita. */
export function buildReminderMessage(appt: Appointment): string {
  const fecha = formatDateLong(appt.appointment_date)
  const hora = appt.start_time.slice(0, 5)
  return (
    `¡Hola ${appt.owner_name}! 🐾\n\n` +
    `Te recordamos la cita de ${appt.pet_name} en Cuatro Huellas:\n` +
    `📅 ${fecha}\n` +
    `🕐 ${hora} hrs\n` +
    `✂️ ${serviceLabel(appt.service)}\n\n` +
    `📍 Rubén Darío 146, Valdivia\n\n` +
    `¡Te esperamos! Si no puedes asistir, avísanos por favor.`
  )
}
