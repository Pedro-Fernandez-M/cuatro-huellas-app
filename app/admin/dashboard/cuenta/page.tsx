import { getCurrentUserEmail } from '@/actions/account'
import AccountManager from '@/components/admin/AccountManager'

export const dynamic = 'force-dynamic'

export default async function CuentaPage() {
  const email = await getCurrentUserEmail()
  return (
    <div>
      <h1 className="text-2xl font-black tracking-tight mb-1">Mi cuenta</h1>
      <p className="text-sm text-muted-foreground mb-8">Cambia tu contraseña o la de otra cuenta del staff.</p>
      <AccountManager myEmail={email} />
    </div>
  )
}
