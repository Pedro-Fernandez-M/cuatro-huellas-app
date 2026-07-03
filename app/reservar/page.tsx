import BookingWizard from '@/components/booking/BookingWizard'
import { Logo } from '@/components/Logo'
import Link from 'next/link'
import { getCatalog } from '@/actions/catalog'

export const dynamic = 'force-dynamic'

export default async function ReservarPage() {
  const { services, prices } = await getCatalog()
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b border-border">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 h-16 flex items-center">
          <Link href="/" className="flex items-center gap-2.5 font-black text-lg tracking-tight">
            <Logo size={40} />
            Cuatro Huellas
          </Link>
        </div>
      </header>
      <main className="flex-1 py-10 sm:py-14">
        <div className="max-w-3xl mx-auto px-4 sm:px-6">
          <BookingWizard services={services} prices={prices} />
        </div>
      </main>
    </div>
  )
}
