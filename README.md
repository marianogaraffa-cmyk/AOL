# AOL · Dashboard de performance de instructores

Web app que reemplaza el artefacto estático (Excel → HTML) por un dashboard
dinámico: los datos se importan desde un Excel mensual, se guardan en
Supabase (Postgres) y cada instructor ve su propia performance (ingresos,
egresos, resultado) con su login.

## Stack

- **Next.js 16** (App Router, TypeScript, Tailwind)
- **Supabase**: Postgres + Auth + Row Level Security (cada instructor solo
  puede leer sus propias transacciones; los admins ven y cargan todo)
- **Recharts** para los gráficos
- **exceljs** para parsear el Excel importado

## Setup local

1. `npm install`
2. Variables de entorno en `.env.local` (ya configurado con el proyecto de
   Supabase del equipo):
   ```
   NEXT_PUBLIC_SUPABASE_URL=...
   NEXT_PUBLIC_SUPABASE_ANON_KEY=...
   ```
3. Correr el esquema de base de datos: copiar `supabase/schema.sql` en
   Supabase → **SQL Editor** y ejecutarlo. Crea las tablas, las políticas de
   RLS y categorías base.
4. `npm run dev` → http://localhost:3000

## Alta de usuarios

1. **Admin**: crear el usuario en Supabase → Authentication → Users. Después,
   en el SQL Editor:
   ```sql
   update profiles set role = 'admin' where id = '<id_del_usuario>';
   ```
2. **Instructor**: crear el usuario en Supabase → Authentication → Users.
   Vincularlo al instructor (creado automáticamente al importar el Excel, o
   creado a mano en la tabla `instructors`):
   ```sql
   update instructors set user_id = '<id_del_usuario>' where id = '<id_instructor>';
   update profiles set instructor_id = '<id_instructor>' where id = '<id_del_usuario>';
   ```

## Importar el Excel mensual

Desde `/admin`, elegir el mes y subir un `.xlsx` con estas columnas (en la
primera fila, cualquier orden):

| Instructor | Categoria | Tipo | Monto |
|---|---|---|---|

- `Tipo` debe ser `ingreso` o `egreso`.
- Si el instructor o la categoría no existen, se crean automáticamente.
- Volver a subir un archivo para el mismo mes **reemplaza** los datos de ese
  mes (no duplica).

## Estructura

- `supabase/schema.sql` — esquema de DB + RLS (fuente de verdad del modelo de
  datos)
- `src/lib/supabase/` — clientes de Supabase (browser, server, middleware)
- `src/app/login` — autenticación
- `src/app/dashboard` — vista del instructor
- `src/app/admin` — importador de Excel + vista de administración
- `src/lib/excel/parse-transactions.ts` — parseo y validación del Excel

## Roadmap

- [x] Dashboard dinámico leyendo de la base de datos
- [x] Importador de Excel con reemplazo por mes
- [x] Auth con roles admin/instructor y RLS
- [ ] Deploy a Vercel
- [ ] Módulo de Planificación (carga manual de presupuesto vs. real)
