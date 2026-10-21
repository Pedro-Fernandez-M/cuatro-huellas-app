import { buildBackup, backupFilename, type BackupResult } from '@/lib/backup'

// Siempre dinámico; corre en el runtime Node (necesita Buffer y la service key).
export const dynamic = 'force-dynamic'
export const maxDuration = 60

const DEFAULT_TO = 'pfernandezinfo@gmail.com'
// Resend permite enviar desde onboarding@resend.dev al correo dueño de la cuenta
// sin verificar dominio. Si verificas cuatrohuellas.cl, cambia BACKUP_FROM.
const DEFAULT_FROM = 'Respaldo Cuatro Huellas <onboarding@resend.dev>'

async function emailBackup(apiKey: string, backup: BackupResult): Promise<void> {
  const to = process.env.BACKUP_EMAIL?.trim() || DEFAULT_TO
  const from = process.env.BACKUP_FROM?.trim() || DEFAULT_FROM
  const date = backup.generatedAt.slice(0, 10)
  const summary = Object.entries(backup.counts)
    .map(([t, n]) => `${t}: <strong>${n}</strong>`)
    .join(' · ')

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      from,
      to,
      subject: `Respaldo Cuatro Huellas — ${date}`,
      html: `<p>Respaldo automático de la base de datos de Cuatro Huellas.</p>
             <p style="color:#555">${summary}</p>
             <p style="color:#888;font-size:12px">Generado ${backup.generatedAt}. El archivo JSON va adjunto.</p>`,
      attachments: [
        { filename: backupFilename(backup.generatedAt), content: Buffer.from(backup.json, 'utf8').toString('base64') },
      ],
    }),
  })

  if (!res.ok) {
    throw new Error(`Resend respondió ${res.status}: ${(await res.text()).slice(0, 300)}`)
  }
}

export async function GET(request: Request) {
  // Protección: la ruta vuelca datos personales, así que exige el secreto.
  // Vercel Cron manda este header automáticamente cuando CRON_SECRET está en el entorno.
  const secret = process.env.CRON_SECRET?.trim()
  if (!secret || request.headers.get('authorization') !== `Bearer ${secret}`) {
    return new Response('No autorizado', { status: 401 })
  }

  const backup = await buildBackup()
  if (backup.error) {
    return Response.json({ ok: false, error: backup.error }, { status: 500 })
  }

  // La lectura de las tablas ya mantuvo viva la base (esto corre TODOS los días).
  // El correo, en cambio, se envía solo una vez por semana (por defecto, lunes),
  // o cuando se fuerza con ?email=1 (para probar manualmente).
  const url = new URL(request.url)
  const forceEmail = url.searchParams.get('email') === '1'
  const weeklyDay = Number(process.env.BACKUP_WEEKLY_DAY ?? '1') // 0=dom ... 6=sáb; 1=lunes
  const shouldEmail = forceEmail || chileWeekday() === weeklyDay

  let emailed = false
  let emailError: string | undefined
  const resendKey = process.env.RESEND_API_KEY?.trim()
  if (resendKey && shouldEmail) {
    try {
      await emailBackup(resendKey, backup)
      emailed = true
    } catch (e) {
      emailError = e instanceof Error ? e.message : String(e)
    }
  }

  return Response.json({
    ok: true,
    keptAlive: true,
    shouldEmail,
    emailed,
    emailConfigured: Boolean(resendKey),
    emailError,
    generatedAt: backup.generatedAt,
    counts: backup.counts,
  })
}

/** Día de la semana (0=domingo … 6=sábado) en la zona horaria del local. */
function chileWeekday(): number {
  const s = new Intl.DateTimeFormat('en-US', { timeZone: 'America/Santiago', weekday: 'short' }).format(new Date())
  const map: Record<string, number> = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 }
  return map[s] ?? -1
}
