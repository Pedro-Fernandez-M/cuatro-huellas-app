'use server'

import { createClient } from '@/lib/supabase/server'
import { createAdminClient } from '@/lib/supabase/admin'

interface ActionResult {
  success: boolean
  error?: string
}

export async function getCurrentUserEmail(): Promise<string | null> {
  try {
    const supabase = await createClient()
    const { data } = await supabase.auth.getUser()
    return data.user?.email ?? null
  } catch {
    return null
  }
}

/** Cambia la contraseña del usuario que tiene la sesión iniciada. */
export async function changeMyPassword(newPassword: string): Promise<ActionResult> {
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
  }
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Debes iniciar sesión.' }

    const { error } = await supabase.auth.updateUser({ password: newPassword })
    if (error) return { success: false, error: 'No se pudo cambiar la contraseña. Intenta nuevamente.' }
    return { success: true }
  } catch {
    return { success: false, error: 'Error de conexión.' }
  }
}

/**
 * Resetea la contraseña de OTRA cuenta (por email). Requiere sesión iniciada
 * y la SERVICE ROLE key configurada en el servidor (Vercel).
 */
export async function adminSetUserPassword(email: string, newPassword: string): Promise<ActionResult> {
  if (!email.trim()) return { success: false, error: 'Ingresa el email de la cuenta.' }
  if (!newPassword || newPassword.length < 6) {
    return { success: false, error: 'La contraseña debe tener al menos 6 caracteres.' }
  }

  try {
    // El que llama debe estar autenticado (staff)
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return { success: false, error: 'Debes iniciar sesión.' }

    const admin = createAdminClient()
    if (!admin) {
      return {
        success: false,
        error: 'Falta configurar SUPABASE_SERVICE_ROLE_KEY en Vercel para poder cambiar contraseñas de otras cuentas.',
      }
    }

    // Buscar el usuario por email
    const target = email.trim().toLowerCase()
    let userId: string | null = null
    let page = 1
    // Paginación por si hay varios usuarios (peluquería chica: 1-2 páginas máx.)
    for (; page <= 10 && !userId; page++) {
      const { data, error } = await admin.auth.admin.listUsers({ page, perPage: 200 })
      if (error) return { success: false, error: 'No se pudo consultar los usuarios.' }
      const found = data.users.find((u) => u.email?.toLowerCase() === target)
      if (found) userId = found.id
      if (data.users.length < 200) break
    }

    if (!userId) return { success: false, error: `No existe una cuenta con el email ${email}.` }

    const { error: updErr } = await admin.auth.admin.updateUserById(userId, { password: newPassword })
    if (updErr) return { success: false, error: 'No se pudo cambiar la contraseña de esa cuenta.' }

    return { success: true }
  } catch {
    return { success: false, error: 'Error de conexión.' }
  }
}
