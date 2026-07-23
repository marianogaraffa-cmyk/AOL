-- Esquema inicial: instructores, categorías, importaciones y transacciones.
-- Correr este script completo en Supabase → SQL Editor.

create extension if not exists "pgcrypto";

-- ---------------------------------------------------------------------------
-- Tablas
-- ---------------------------------------------------------------------------

create table if not exists instructors (
  id uuid primary key default gen_random_uuid(),
  user_id uuid unique references auth.users (id) on delete set null,
  name text not null,
  email text unique,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

-- Un perfil por usuario de auth, con su rol. Se crea automáticamente al
-- registrarse (ver trigger más abajo) con rol 'instructor' por defecto;
-- los admins se promueven a mano con un UPDATE.
create table if not exists profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  role text not null default 'instructor' check (role in ('admin', 'instructor')),
  instructor_id uuid references instructors (id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  type text not null check (type in ('ingreso', 'egreso')),
  created_at timestamptz not null default now(),
  unique (name, type)
);

create table if not exists import_batches (
  id uuid primary key default gen_random_uuid(),
  filename text not null,
  period date not null,
  uploaded_by uuid references auth.users (id),
  uploaded_at timestamptz not null default now(),
  row_count int not null default 0
);

create table if not exists transactions (
  id uuid primary key default gen_random_uuid(),
  instructor_id uuid not null references instructors (id) on delete cascade,
  category_id uuid not null references categories (id),
  period date not null,
  type text not null check (type in ('ingreso', 'egreso')),
  amount numeric(14, 2) not null,
  currency text not null default 'MXN',
  description text,
  batch_id uuid references import_batches (id) on delete set null,
  created_at timestamptz not null default now()
);

create index if not exists transactions_instructor_period_idx
  on transactions (instructor_id, period);
create index if not exists transactions_batch_idx on transactions (batch_id);

-- ---------------------------------------------------------------------------
-- Auto-crear perfil al registrarse un usuario nuevo
-- ---------------------------------------------------------------------------

create or replace function handle_new_user()
returns trigger as $$
begin
  insert into profiles (id, role) values (new.id, 'instructor');
  return new;
end;
$$ language plpgsql security definer set search_path = public;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function handle_new_user();

-- ---------------------------------------------------------------------------
-- Row Level Security
-- ---------------------------------------------------------------------------

alter table instructors enable row level security;
alter table profiles enable row level security;
alter table categories enable row level security;
alter table import_batches enable row level security;
alter table transactions enable row level security;

create or replace function is_admin()
returns boolean as $$
  select exists (
    select 1 from profiles where id = auth.uid() and role = 'admin'
  );
$$ language sql security definer stable set search_path = public;

-- profiles: cada usuario ve su propio perfil; admin ve todos.
create policy "profiles_select" on profiles for select
  using (id = auth.uid() or is_admin());
create policy "profiles_admin_write" on profiles for update
  using (is_admin()) with check (is_admin());

-- instructors: el instructor ve su propia fila; admin ve y edita todas.
create policy "instructors_select" on instructors for select
  using (user_id = auth.uid() or is_admin());
create policy "instructors_admin_insert" on instructors for insert
  with check (is_admin());
create policy "instructors_admin_update" on instructors for update
  using (is_admin()) with check (is_admin());
create policy "instructors_admin_delete" on instructors for delete
  using (is_admin());

-- categories: lectura para cualquier usuario logueado; solo admin escribe.
create policy "categories_select" on categories for select
  using (auth.role() = 'authenticated');
create policy "categories_admin_insert" on categories for insert
  with check (is_admin());
create policy "categories_admin_update" on categories for update
  using (is_admin()) with check (is_admin());
create policy "categories_admin_delete" on categories for delete
  using (is_admin());

-- import_batches: solo admin.
create policy "import_batches_admin_select" on import_batches for select
  using (is_admin());
create policy "import_batches_admin_insert" on import_batches for insert
  with check (is_admin());

-- transactions: el instructor ve solo las suyas; admin ve y escribe todas.
create policy "transactions_select" on transactions for select
  using (
    is_admin()
    or instructor_id in (
      select id from instructors where user_id = auth.uid()
    )
  );
create policy "transactions_admin_insert" on transactions for insert
  with check (is_admin());
create policy "transactions_admin_update" on transactions for update
  using (is_admin()) with check (is_admin());
create policy "transactions_admin_delete" on transactions for delete
  using (is_admin());

-- ---------------------------------------------------------------------------
-- Categorías base (ajustar/ampliar según tu plan de cuentas real)
-- ---------------------------------------------------------------------------

insert into categories (name, type) values
  ('Clases y talleres', 'ingreso'),
  ('Otros ingresos', 'ingreso'),
  ('Alquiler', 'egreso'),
  ('Materiales', 'egreso'),
  ('Otros gastos', 'egreso')
on conflict (name, type) do nothing;
