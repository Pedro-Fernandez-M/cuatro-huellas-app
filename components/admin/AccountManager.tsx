'use client'

import { useState, useTransition } from 'react'
import { KeyRound, UserCog, Loader2, Check } from 'lucide-react'
import { changeMyPassword, adminSetUserPassword } from '@/actions/account'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

function Feedback({ ok, msg }: { ok: boolean; msg: string }) {
  return (
    <div className={`p-3 rounded-xl text-sm ${ok ? 'border border-primary/30 bg-primary/5 text-primary' : 'border border-destructive/40 bg-destructive/10 text-destructive'}`}>
      {msg}
    </div>
  )
}

export default function AccountManager({ myEmail }: { myEmail: string | null }) {
  // Mi contraseña
  const [pw1, setPw1] = useState('')
  const [pw2, setPw2] = useState('')
  const [myResult, setMyResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pendingMine, startMine] = useTransition()

  function submitMine() {
    setMyResult(null)
    if (pw1.length < 6) { setMyResult({ ok: false, msg: 'La contraseña debe tener al menos 6 caracteres.' }); return }
    if (pw1 !== pw2) { setMyResult({ ok: false, msg: 'Las contraseñas no coinciden.' }); return }
    startMine(async () => {
      const r = await changeMyPassword(pw1)
      if (r.success) { setMyResult({ ok: true, msg: 'Tu contraseña fue actualizada ✓' }); setPw1(''); setPw2('') }
      else setMyResult({ ok: false, msg: r.error ?? 'Error' })
    })
  }

  // Contraseña de otra cuenta
  const [email, setEmail] = useState('')
  const [opw, setOpw] = useState('')
  const [otherResult, setOtherResult] = useState<{ ok: boolean; msg: string } | null>(null)
  const [pendingOther, startOther] = useTransition()

  function submitOther() {
    setOtherResult(null)
    if (opw.length < 6) { setOtherResult({ ok: false, msg: 'La contraseña debe tener al menos 6 caracteres.' }); return }
    startOther(async () => {
      const r = await adminSetUserPassword(email, opw)
      if (r.success) { setOtherResult({ ok: true, msg: `Contraseña de ${email} actualizada ✓` }); setOpw('') }
      else setOtherResult({ ok: false, msg: r.error ?? 'Error' })
    })
  }

  return (
    <div className="max-w-md space-y-8">
      {/* Mi contraseña */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="font-bold flex items-center gap-2 mb-1"><KeyRound className="size-4 text-primary" /> Mi contraseña</h2>
        <p className="text-xs text-muted-foreground mb-4">{myEmail ? `Sesión: ${myEmail}` : 'Cambia tu propia contraseña'}</p>
        <div className="space-y-3">
          <div>
            <Label>Nueva contraseña</Label>
            <Input type="password" value={pw1} onChange={(e) => setPw1(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="new-password" />
          </div>
          <div>
            <Label>Repetir contraseña</Label>
            <Input type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" />
          </div>
          {myResult && <Feedback ok={myResult.ok} msg={myResult.msg} />}
          <Button onClick={submitMine} disabled={pendingMine} className="w-full">
            {pendingMine ? <Loader2 className="size-4 animate-spin" /> : <Check className="size-4" />} Cambiar mi contraseña
          </Button>
        </div>
      </div>

      {/* Contraseña de otra cuenta */}
      <div className="p-5 rounded-2xl border border-border bg-card">
        <h2 className="font-bold flex items-center gap-2 mb-1"><UserCog className="size-4 text-primary" /> Cambiar contraseña de otra cuenta</h2>
        <p className="text-xs text-muted-foreground mb-4">Para resetear la clave de otro miembro del staff (ej. si la olvidó).</p>
        <div className="space-y-3">
          <div>
            <Label>Email de la cuenta</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="isabel@cuatrohuellas.cl" autoComplete="off" />
          </div>
          <div>
            <Label>Nueva contraseña</Label>
            <Input type="text" value={opw} onChange={(e) => setOpw(e.target.value)} placeholder="Mínimo 6 caracteres" autoComplete="off" />
          </div>
          {otherResult && <Feedback ok={otherResult.ok} msg={otherResult.msg} />}
          <Button onClick={submitOther} disabled={pendingOther} className="w-full">
            {pendingOther ? <Loader2 className="size-4 animate-spin" /> : <UserCog className="size-4" />} Actualizar contraseña
          </Button>
        </div>
      </div>
    </div>
  )
}
