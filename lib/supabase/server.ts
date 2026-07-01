import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import { getSupabaseConfigError, getSupabaseEnv } from './config'

export async function createClient() {
  const { url, anonKey } = getSupabaseEnv()

  if (!url || !anonKey) {
    throw new Error(getSupabaseConfigError())
  }

  const cookieStore = await cookies()

  return createServerClient(url, anonKey, {
    cookies: {
      getAll() {
        return cookieStore.getAll()
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          )
        } catch {
          // Llamado desde un Server Component — se puede ignorar
        }
      },
    },
  })
}
