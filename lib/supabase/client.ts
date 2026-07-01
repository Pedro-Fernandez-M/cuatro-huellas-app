import { createBrowserClient } from '@supabase/ssr'
import { getSupabaseConfigError, getSupabaseEnv } from './config'

export function createClient() {
  const { url, anonKey } = getSupabaseEnv()

  if (!url || !anonKey) {
    throw new Error(getSupabaseConfigError())
  }

  return createBrowserClient(url, anonKey)
}
