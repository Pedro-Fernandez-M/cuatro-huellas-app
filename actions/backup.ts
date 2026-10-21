'use server'

import { requireAdmin } from '@/lib/auth/roles'
import { buildBackup, backupFilename } from '@/lib/backup'

/** Genera el respaldo completo para descargar desde el panel (solo admin). */
export async function downloadBackup(): Promise<{ json: string; filename: string; error?: string }> {
  await requireAdmin()
  const b = await buildBackup()
  if (b.error) return { json: '', filename: '', error: b.error }
  return { json: b.json, filename: backupFilename(b.generatedAt) }
}
