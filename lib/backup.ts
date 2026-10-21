import { createAdminClient } from '@/lib/supabase/admin'

/** Tablas que entran en el respaldo completo de la base. */
export const BACKUP_TABLES = [
  'staff',
  'clients',
  'pets',
  'appointments',
  'blocked_dates',
  'services',
  'pricing',
  'offers',
  'inventory_products',
  'inventory_movements',
  'manual_incomes',
  'expenses',
  'push_subscriptions',
] as const

export interface BackupResult {
  json: string
  counts: Record<string, number>
  generatedAt: string
  error?: string
}

/**
 * Lee TODAS las tablas con la service role key y arma un JSON con todo.
 * El acto de leer también mantiene el proyecto Supabase activo (evita la
 * pausa por 7 días de inactividad del plan gratuito).
 */
export async function buildBackup(): Promise<BackupResult> {
  const generatedAt = new Date().toISOString()
  const admin = createAdminClient()
  if (!admin) {
    return { json: '', counts: {}, generatedAt, error: 'Falta SUPABASE_SERVICE_ROLE_KEY.' }
  }

  const tables: Record<string, unknown[]> = {}
  const counts: Record<string, number> = {}

  for (const t of BACKUP_TABLES) {
    const { data, error } = await admin.from(t).select('*')
    // Si una tabla no existe todavía, la saltamos sin romper el respaldo.
    tables[t] = error ? [] : (data ?? [])
    counts[t] = error ? 0 : (data?.length ?? 0)
  }

  const payload = { project: 'cuatro-huellas', generatedAt, counts, tables }
  return { json: JSON.stringify(payload, null, 2), counts, generatedAt }
}

/** Nombre de archivo sugerido para el respaldo. */
export function backupFilename(generatedAt: string): string {
  return `respaldo-cuatrohuellas-${generatedAt.slice(0, 10)}.json`
}
