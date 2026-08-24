import type { Metadata, Viewport } from 'next'

/**
 * Layout de todo /admin (login + panel). Solo existe para colgar aquí el
 * manifest de la PWA: así el panel es instalable como app pero la web pública
 * no ofrece instalar nada.
 */
export const metadata: Metadata = {
  title: { default: 'Panel — Cuatro Huellas', template: '%s · Panel Cuatro Huellas' },
  manifest: '/admin/manifest.webmanifest',
  appleWebApp: { capable: true, title: 'CH Panel', statusBarStyle: 'default' },
  robots: { index: false, follow: false },
}

export const viewport: Viewport = {
  themeColor: '#225176',
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return children
}
