# 🐾 Cuatro Huellas — Guía de Instalación Completa

Sistema web de reservas para peluquería canina con Next.js, Supabase y TailwindCSS.

---

## 📋 Prerrequisitos

- Node.js 20+
- npm
- Cuenta en [Supabase](https://supabase.com) (gratis)

---

## 🚀 Paso a Paso

### 1. Instalar dependencias

```bash
npm install
```

### 2. Configurar Supabase

1. Ve a [supabase.com](https://supabase.com) y crea un proyecto nuevo (distinto al de cualquier
   otro negocio).
2. Espera que el proyecto termine de inicializarse (2-3 min).
3. Ve a **Settings → API** y copia:
   - `Project URL` → `NEXT_PUBLIC_SUPABASE_URL`
   - `anon public` key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 3. Crear variables de entorno

```bash
cp .env.local.example .env.local
```

Edita `.env.local` con tus credenciales de Supabase.

### 4. Crear las tablas en Supabase

1. Ve a Supabase Dashboard → **SQL Editor**.
2. Ejecuta TODO el contenido de [`SQL.md`](./SQL.md) (copiar y pegar, en orden).
3. Verifica que se crearon las tablas: `clients`, `pets`, `appointments`, `blocked_dates`,
   `inventory_products`, `inventory_movements`, y las funciones `book_appointment`,
   `reschedule_appointment`, `get_available_slots`, `record_inventory_movement`.

### 5. Crear usuario(s) del staff

1. Ve a Supabase Dashboard → **Authentication → Users → Add user**.
2. Ingresa email y contraseña (recuérdala, la usarás para entrar a `/admin/login`).
3. Recomendado: en **Authentication → Providers**, deja desactivado el registro público (la app
   no tiene pantalla de "crear cuenta" — todos los usuarios se crean a mano acá).

### 6. Iniciar en desarrollo

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000)

---

## 📱 URLs del sistema

| URL | Descripción |
|-----|-------------|
| `/` | Landing pública |
| `/reservar` | Reservar hora (clientes, sin login) |
| `/admin/login` | Login staff |
| `/admin/dashboard` | Inicio: citas de hoy, cupo actual |
| `/admin/dashboard/agenda` | Ver/reprogramar/cancelar citas, bloquear días |
| `/admin/dashboard/walk-in` | Ingreso manual (cliente sin reserva) |
| `/admin/dashboard/checkin/[id]` | Marcar llegada/salida y precio cobrado |
| `/admin/dashboard/clients` | Registro de clientes y mascotas |
| `/admin/dashboard/ingresos` | Ingresos semana/mes |
| `/admin/dashboard/inventario` | Stock y movimientos de productos |

---

## 🌐 Deploy en Vercel

```bash
npm install -g vercel
vercel
```

Configura en el dashboard de Vercel las mismas dos variables de entorno
(`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`).

---

## 🔒 Seguridad

- Las rutas `/admin/dashboard/*` están protegidas por `proxy.ts` (el equivalente a middleware en
  esta versión de Next.js).
- Los clientes NO necesitan cuenta para reservar — todo pasa por la función `book_appointment`
  (ver `SQL.md`), que valida el cupo de 3 perros simultáneos antes de crear la reserva.
- Nadie anónimo puede leer datos de clientes/mascotas/inventario directamente; solo el staff
  autenticado.

---

## 🎨 Personalización pendiente

- **Fotos y logo reales**: hoy la landing (`app/page.tsx`) usa solo íconos, ya que no había fotos
  disponibles al momento de construir la app. Reemplázalas cuando las tengas.
- **Dirección exacta**: agrega la dirección del local en la sección "Ubicación" de la landing.
- **Lista de razas** (`lib/constants/breeds.ts`): revisa que incluya las razas más comunes entre
  tus clientes (Poodle está primero a propósito).
- **Stock inicial del inventario**: ajusta las cantidades en el `insert` de `SQL.md` (Paso 5)
  antes de ejecutarlo, o corrígelas después desde `/admin/dashboard/inventario`.
