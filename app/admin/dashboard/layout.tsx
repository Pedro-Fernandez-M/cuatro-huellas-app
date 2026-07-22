import Link from 'next/link'
import {
  LayoutDashboard, CalendarDays, UserPlus,
  Users, TrendingUp, TrendingDown, Package, LogOut, History, Calculator, Scissors, KeyRound, BarChart3, Bell,
} from 'lucide-react'
import { Logo } from '@/components/Logo'
import { signOut } from '@/actions/auth'

const NAV = [
  { href: '/admin/dashboard', label: 'Inicio', icon: LayoutDashboard },
  { href: '/admin/dashboard/resumen', label: 'Dashboard', icon: BarChart3 },
  { href: '/admin/dashboard/agenda', label: 'Agenda', icon: CalendarDays },
  { href: '/admin/dashboard/walk-in', label: 'Agregar cita', icon: UserPlus },
  { href: '/admin/dashboard/recordatorios', label: 'Recordatorios', icon: Bell },
  { href: '/admin/dashboard/clients', label: 'Clientes', icon: Users },
  { href: '/admin/dashboard/historial', label: 'Historial', icon: History },
  { href: '/admin/dashboard/ingresos', label: 'Ingresos', icon: TrendingUp },
  { href: '/admin/dashboard/gastos', label: 'Gastos', icon: TrendingDown },
  { href: '/admin/dashboard/contabilidad', label: 'Contabilidad', icon: Calculator },
  { href: '/admin/dashboard/inventario', label: 'Inventario', icon: Package },
  { href: '/admin/dashboard/servicios', label: 'Servicios', icon: Scissors },
  { href: '/admin/dashboard/cuenta', label: 'Mi cuenta', icon: KeyRound },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col lg:flex-row">
      <aside className="lg:w-60 shrink-0 border-b lg:border-b-0 lg:border-r border-border bg-card/60">
        <div className="p-5 flex items-center gap-2.5 font-black tracking-tight border-b border-border">
          <Logo size={36} />
          Cuatro Huellas
        </div>
        <nav className="p-3 flex lg:flex-col gap-1 overflow-x-auto lg:overflow-visible">
          {NAV.map(({ href, label, icon: Icon }) => (
            <Link
              key={href}
              href={href}
              className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-secondary/60 transition-colors whitespace-nowrap"
            >
              <Icon className="size-4" />
              {label}
            </Link>
          ))}
          <form action={signOut} className="lg:mt-4">
            <button className="flex items-center gap-2.5 px-3 py-2.5 rounded-lg text-sm font-medium text-muted-foreground hover:text-destructive hover:bg-destructive/5 transition-colors whitespace-nowrap w-full">
              <LogOut className="size-4" />
              Cerrar sesión
            </button>
          </form>
        </nav>
      </aside>
      <main className="flex-1 p-5 sm:p-8 max-w-5xl">{children}</main>
    </div>
  )
}
