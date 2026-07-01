'use server'

import { createClient } from '@/lib/supabase/server'
import { redirect } from 'next/navigation'

export async function signIn(formData: FormData) {
  const email = formData.get('email') as string
  const password = formData.get('password') as string

  if (!email || !password) {
    return { success: false, error: 'Email y contraseña son requeridos.' }
  }

  try {
    const supabase = await createClient()
    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      return { success: false, error: 'Credenciales incorrectas. Verifica tu email y contraseña.' }
    }

    redirect('/admin/dashboard')
  } catch {
    return { success: false, error: 'No se pudo conectar con Supabase. Revisa la configuración del proyecto en Vercel.' }
  }
}

export async function signOut() {
  try {
    const supabase = await createClient()
    await supabase.auth.signOut()
  } catch {
    // Ignorar, la sesión ya no estará disponible si la configuración falla
  }

  redirect('/admin/login')
}
