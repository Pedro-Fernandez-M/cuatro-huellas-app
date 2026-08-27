import { redirect } from 'next/navigation'
import { getCurrentStaff } from '@/actions/staff'

/**
 * Protege páginas solo-admin. Redirige a la asistente al inicio del panel.
 * Retrocompatible: si no se puede determinar el rol (sesión sin registro en
 * `staff`, migración aún sin correr), se permite el acceso — así nunca se
 * bloquea por error a la administradora.
 */
export async function requireAdmin() {
  const staff = await getCurrentStaff()
  if (staff?.role === 'assistant') redirect('/admin/dashboard')
  return staff
}
