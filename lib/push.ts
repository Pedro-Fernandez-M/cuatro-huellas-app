import webpush from 'web-push'
import { createAdminClient } from '@/lib/supabase/admin'

/**
 * Envío de notificaciones Web Push al staff.
 *
 * Se usa la service role key para leer `push_subscriptions` porque el aviso de
 * "reserva nueva" se dispara desde una reserva pública, donde no hay sesión de
 * staff y RLS bloquearía la lectura.
 */

const PUBLIC_KEY = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY?.trim() ?? ''
const PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY?.trim() ?? ''

// El "subject" VAPID es el contacto que el servicio de push (FCM, Mozilla…) usa
// si necesita avisarnos de un problema. Debe ser una URL https: o un mailto:.
const VAPID_SUBJECT = 'https://cuatrohuellas.cl'

export function isPushConfigured(): boolean {
  return Boolean(PUBLIC_KEY && PRIVATE_KEY)
}

let vapidReady = false
function ensureVapid() {
  if (vapidReady) return
  webpush.setVapidDetails(VAPID_SUBJECT, PUBLIC_KEY, PRIVATE_KEY)
  vapidReady = true
}

export interface PushPayload {
  title: string
  body: string
  /** A dónde lleva el toque en la notificación. Por defecto, la agenda. */
  url?: string
  /** Dos avisos con el mismo tag se reemplazan en vez de apilarse. */
  tag?: string
}

export interface PushResult {
  sent: number
  failed: number
  /** Suscripciones que el navegador ya dio de baja y borramos de la tabla. */
  pruned: number
}

/**
 * Manda el mismo aviso a todos los dispositivos registrados del staff.
 * Nunca lanza: si algo falla, lo informa en el resultado y sigue.
 */
export async function sendPushToStaff(payload: PushPayload): Promise<PushResult> {
  const empty: PushResult = { sent: 0, failed: 0, pruned: 0 }
  if (!isPushConfigured()) return empty

  const admin = createAdminClient()
  if (!admin) return empty

  const { data, error } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth')

  if (error || !data?.length) return empty

  ensureVapid()

  const body = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? '/admin/dashboard/agenda',
    tag: payload.tag,
  })

  const expiredIds: string[] = []
  const sentIds: string[] = []
  let failed = 0

  await Promise.all(
    data.map(async (row) => {
      try {
        await webpush.sendNotification(
          { endpoint: row.endpoint, keys: { p256dh: row.p256dh, auth: row.auth } },
          body
        )
        sentIds.push(row.id)
      } catch (err) {
        // 404/410 = el navegador desinstaló la app o revocó el permiso.
        // Esa suscripción ya no sirve nunca más, así que se borra.
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          expiredIds.push(row.id)
        } else {
          failed++
          console.error('[push] falló el envío', status, (err as Error).message)
        }
      }
    })
  )

  if (expiredIds.length) {
    await admin.from('push_subscriptions').delete().in('id', expiredIds)
  }

  if (sentIds.length) {
    await admin
      .from('push_subscriptions')
      .update({ last_sent_at: new Date().toISOString() })
      .in('id', sentIds)
  }

  return { sent: sentIds.length, failed, pruned: expiredIds.length }
}
