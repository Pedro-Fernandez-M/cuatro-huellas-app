'use server'

import { createClient } from '@/lib/supabase/server'
import { isPushConfigured, sendPushToStaff } from '@/lib/push'

interface ActionResult {
  success: boolean
  error?: string
}

export interface PushDevice {
  id: string
  endpoint: string
  deviceLabel: string | null
  createdAt: string
  lastSentAt: string | null
}

/** Suscripción tal como la entrega el navegador, ya serializada a JSON. */
export interface BrowserSubscription {
  endpoint: string
  keys: { p256dh: string; auth: string }
}

export async function getPushConfigured(): Promise<boolean> {
  return isPushConfigured()
}

/** Dispositivos que este usuario tiene registrados para recibir avisos. */
export async function listMyPushDevices(): Promise<PushDevice[]> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return []

    const { data, error } = await supabase
      .from('push_subscriptions')
      .select('id, endpoint, device_label, created_at, last_sent_at')
      .eq('user_id', user.id)
      .order('created_at', { ascending: true })

    if (error || !data) return []
    return data.map((r) => ({
      id: r.id as string,
      endpoint: r.endpoint as string,
      deviceLabel: (r.device_label as string | null) ?? null,
      createdAt: r.created_at as string,
      lastSentAt: (r.last_sent_at as string | null) ?? null,
    }))
  } catch {
    return []
  }
}

export async function savePushSubscription(
  sub: BrowserSubscription,
  deviceLabel: string
): Promise<ActionResult> {
  if (!sub?.endpoint || !sub.keys?.p256dh || !sub.keys?.auth) {
    return { success: false, error: 'El navegador entregó una suscripción incompleta.' }
  }

  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Debes iniciar sesión.' }

    // onConflict en endpoint: si el mismo teléfono vuelve a activar los avisos,
    // se actualiza la fila en vez de crear una duplicada.
    const { error } = await supabase
      .from('push_subscriptions')
      .upsert(
        {
          endpoint: sub.endpoint,
          p256dh: sub.keys.p256dh,
          auth: sub.keys.auth,
          device_label: deviceLabel.trim() || 'Dispositivo sin nombre',
          user_id: user.id,
        },
        { onConflict: 'endpoint' }
      )

    if (error) {
      if (error.message?.includes('push_subscriptions')) {
        return { success: false, error: 'Falta correr la migración 12 en Supabase.' }
      }
      return { success: false, error: 'No se pudo guardar el dispositivo.' }
    }
    return { success: true }
  } catch {
    return { success: false, error: 'Error de conexión.' }
  }
}

export async function removePushSubscription(endpoint: string): Promise<ActionResult> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Debes iniciar sesión.' }

    const { error } = await supabase
      .from('push_subscriptions')
      .delete()
      .eq('endpoint', endpoint)
      .eq('user_id', user.id)

    if (error) return { success: false, error: 'No se pudo quitar el dispositivo.' }
    return { success: true }
  } catch {
    return { success: false, error: 'Error de conexión.' }
  }
}

/** Manda un aviso de prueba a todos los dispositivos registrados del staff. */
export async function sendTestPush(): Promise<ActionResult & { sent?: number }> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Debes iniciar sesión.' }

    if (!isPushConfigured()) {
      return { success: false, error: 'Faltan las llaves VAPID en el servidor.' }
    }

    const result = await sendPushToStaff({
      title: 'Prueba — Cuatro Huellas',
      body: 'Si ves este mensaje, las notificaciones están funcionando 🐶',
      tag: 'ch-prueba',
    })

    if (result.sent === 0) {
      return {
        success: false,
        error: result.pruned > 0
          ? 'El dispositivo registrado ya no es válido. Vuelve a activar los avisos.'
          : 'No hay dispositivos registrados todavía.',
      }
    }
    return { success: true, sent: result.sent }
  } catch {
    return { success: false, error: 'Error de conexión.' }
  }
}
