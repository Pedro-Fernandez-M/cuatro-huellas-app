# 🐾 Cuatro Huellas

App de reservas y gestión para la peluquería canina Cuatro Huellas (Valdivia, Chile).

Incluye: landing pública con reserva online sin abono, panel de staff con check-in/check-out de
mascotas, agenda, ingresos semana/mes, inventario de productos y registro de clientes — todo
respetando el cupo máximo de 3 perros simultáneos en el local.

Ver [`SETUP.md`](./SETUP.md) para la guía de instalación completa y [`SQL.md`](./SQL.md) para el
esquema de base de datos.

## Desarrollo

```bash
npm install
cp .env.local.example .env.local   # completa con tus credenciales de Supabase
npm run dev
```

Stack: Next.js (App Router) + TypeScript + Tailwind CSS + Supabase (Postgres + Auth).
