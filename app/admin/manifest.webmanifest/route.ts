/**
 * Manifest de la PWA del PANEL.
 *
 * Va aquí y no en `app/manifest.ts` a propósito: si estuviera en la raíz, un
 * cliente que entra a cuatrohuellas.cl podría instalarse una app que abre el
 * panel de administración. Al colgarlo de /admin, solo el staff lo ve.
 */
export const dynamic = 'force-static'

const MANIFEST = {
  id: '/admin/',
  name: 'Cuatro Huellas — Panel',
  short_name: 'CH Panel',
  description: 'Agenda y reservas de Cuatro Huellas. Avisa cuando entra una reserva nueva.',
  lang: 'es-CL',
  dir: 'ltr',
  start_url: '/admin/dashboard/agenda',
  scope: '/admin/',
  display: 'standalone',
  orientation: 'portrait',
  background_color: '#f2fbf9',
  theme_color: '#225176',
  icons: [
    { src: '/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
    { src: '/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
    { src: '/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
  ],
  shortcuts: [
    { name: 'Agenda de hoy', url: '/admin/dashboard/agenda', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
    { name: 'Agregar cita', url: '/admin/dashboard/walk-in', icons: [{ src: '/icon-192.png', sizes: '192x192' }] },
  ],
}

export function GET() {
  return new Response(JSON.stringify(MANIFEST, null, 2), {
    headers: {
      'Content-Type': 'application/manifest+json; charset=utf-8',
      'Cache-Control': 'public, max-age=0, must-revalidate',
    },
  })
}
