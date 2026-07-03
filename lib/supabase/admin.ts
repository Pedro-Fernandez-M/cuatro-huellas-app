import { createClient } from '@supabase/supabase-js'
import { getSupabaseEnv } from './config'

/**
 * Cliente con la SERVICE ROLE key — solo para uso en el servidor (server actions).
 * Permite operaciones administrativas como resetear la contraseña de otros usuarios.
 * Devuelve null si la variable SUPABASE_SERVICE_ROLE_KEY no está configurada.
 */
export function createAdminClient() {
  const { url } = getSupabaseEnv()
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim()
  if (!url || !serviceKey) return null

  return createClient(url, serviceKey, {
    auth: { autoRefreshToken: false, persistSession: false },
  })
}
