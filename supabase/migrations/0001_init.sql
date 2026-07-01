-- AlivioVenezuela v2 — Centros de acopio product semaphore.
-- Replaces the v1 needs/status_updates model with a shared catalog + per-centro
-- stock status. Run this in the Supabase SQL editor.

-- ---------------------------------------------------------------------------
-- Clean up any v1 objects (safe if they don't exist).
-- ---------------------------------------------------------------------------
drop table if exists public.status_updates cascade;
drop table if exists public.needs cascade;
drop type if exists need_status cascade;
drop type if exists urgency cascade;
drop type if exists category cascade;

-- ---------------------------------------------------------------------------
-- Enums
-- ---------------------------------------------------------------------------
do $$ begin
  create type stock_status as enum ('critico', 'necesita_mas', 'suficiente', 'abundante');
exception when duplicate_object then null; end $$;

do $$ begin
  create type registration_status as enum ('pending', 'approved', 'rejected', 'disabled');
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Tables
-- ---------------------------------------------------------------------------
create table if not exists public.categories (
  id          text primary key,
  name        text not null,
  sort_order  int  not null default 0
);

create table if not exists public.products (
  id          uuid primary key default gen_random_uuid(),
  category_id text not null references public.categories (id) on delete cascade,
  name        text not null,
  sort_order  int  not null default 0
);

create table if not exists public.centros_acopio (
  id                  uuid primary key default gen_random_uuid(),
  name                text not null,
  slug                text not null unique,
  address_label       text not null,
  lat                 double precision not null,
  lng                 double precision not null,
  contact_name        text,
  contact_phone       text,
  admin_password_hash text not null,
  registration_status registration_status not null default 'pending',
  created_at          timestamptz not null default now(),
  approved_at         timestamptz
);

create table if not exists public.product_status (
  id         uuid primary key default gen_random_uuid(),
  centro_id  uuid not null references public.centros_acopio (id) on delete cascade,
  product_id uuid not null references public.products (id) on delete cascade,
  status     stock_status not null,
  updated_at timestamptz not null default now(),
  updated_by text,
  unique (centro_id, product_id)
);

create index if not exists product_status_centro_idx on public.product_status (centro_id);

-- ---------------------------------------------------------------------------
-- Row Level Security
--
-- The browser uses the anon key ONLY for realtime on product_status. All writes
-- go through the server with the service-role key (which bypasses RLS) after a
-- session/role check. We deliberately grant NO anon read on centros_acopio so
-- the admin_password_hash column can never be selected by the browser.
-- ---------------------------------------------------------------------------
alter table public.categories      enable row level security;
alter table public.products        enable row level security;
alter table public.centros_acopio  enable row level security;
alter table public.product_status  enable row level security;

drop policy if exists "public read categories" on public.categories;
create policy "public read categories" on public.categories for select using (true);

drop policy if exists "public read products" on public.products;
create policy "public read products" on public.products for select using (true);

drop policy if exists "public read approved status" on public.product_status;
create policy "public read approved status" on public.product_status
  for select using (
    exists (
      select 1 from public.centros_acopio c
      where c.id = product_status.centro_id
        and c.registration_status = 'approved'
    )
  );

-- Realtime: publish only the public, secret-free table.
do $$ begin
  alter publication supabase_realtime add table public.product_status;
exception when duplicate_object then null; end $$;

-- ---------------------------------------------------------------------------
-- Seed: catalog
-- ---------------------------------------------------------------------------
insert into public.categories (id, name, sort_order) values
  ('alimentos',       'Alimentos',                    0),
  ('higiene',         'Higiene Personal',             1),
  ('insumos_medicos', 'Insumos Médicos',              2),
  ('medicamentos',    'Medicamentos',                 3),
  ('hogar',           'Artículos del Hogar',          4),
  ('herramientas',    'Herramientas',                 5),
  ('ropa',            'Ropa y Calzado',               6),
  ('cama',            'Colchonetas y Ropa de Cama',   7),
  ('juguetes',        'Juguetes',                     8),
  ('colores',         'Colores y Dibujos',            9),
  ('otros',           'Otros',                        10)
on conflict (id) do nothing;

insert into public.products (category_id, name, sort_order) values
  ('alimentos', 'Agua potable', 0),
  ('alimentos', 'Arroz', 1),
  ('alimentos', 'Pasta', 2),
  ('alimentos', 'Harina de maíz', 3),
  ('alimentos', 'Granos', 4),
  ('alimentos', 'Enlatados', 5),
  ('alimentos', 'Aceite', 6),
  ('alimentos', 'Azúcar', 7),
  ('alimentos', 'Sal', 8),
  ('alimentos', 'Café', 9),
  ('alimentos', 'Leche en polvo', 10),
  ('alimentos', 'Fórmulas para bebés', 11),
  ('alimentos', 'Cerelac', 12),
  ('alimentos', 'Compota', 13),
  ('alimentos', 'Huevos', 14),
  ('alimentos', 'Pollo', 15),
  ('alimentos', 'Tabletas purificadoras de agua', 16),
  ('higiene', 'Jabón de baño', 17),
  ('higiene', 'Shampoo', 18),
  ('higiene', 'Pasta dental', 19),
  ('higiene', 'Cepillo dental', 20),
  ('higiene', 'Desodorante', 21),
  ('higiene', 'Afeitadoras', 22),
  ('higiene', 'Pañales', 23),
  ('higiene', 'Toallas sanitarias', 24),
  ('higiene', 'Papel higiénico', 25),
  ('higiene', 'Antibacterial', 26),
  ('higiene', 'Tapabocas', 27),
  ('insumos_medicos', 'Guantes', 28),
  ('insumos_medicos', 'Gasas', 29),
  ('insumos_medicos', 'Vendas', 30),
  ('insumos_medicos', 'Yesos', 31),
  ('insumos_medicos', 'Bisturí', 32),
  ('insumos_medicos', 'Suero oral', 33),
  ('insumos_medicos', 'Macrogoteros', 34),
  ('insumos_medicos', 'Inyectadoras', 35),
  ('insumos_medicos', 'Algodón', 36),
  ('insumos_medicos', 'Bata de quirófano', 37),
  ('insumos_medicos', 'Monos quirúrgicos', 38),
  ('medicamentos', 'Antibióticos', 39),
  ('medicamentos', 'Acetaminofén', 40),
  ('medicamentos', 'Ibuprofeno', 41),
  ('medicamentos', 'Antialérgicos', 42),
  ('medicamentos', 'Cardiovasculares', 43),
  ('medicamentos', 'Pediátricos', 44),
  ('medicamentos', 'Suero fisiológico', 45),
  ('hogar', 'Cloro', 46),
  ('hogar', 'Desinfectante', 47),
  ('hogar', 'Detergente', 48),
  ('hogar', 'Bolsas de basura', 49),
  ('hogar', 'Velas', 50),
  ('hogar', 'Fósforos', 51),
  ('herramientas', 'Bombillos de emergencia', 52),
  ('herramientas', 'Linternas', 53),
  ('herramientas', 'Baterías', 54),
  ('herramientas', 'Lentes de seguridad', 55),
  ('herramientas', 'Guantes de trabajo', 56),
  ('herramientas', 'Mangueras (mínimo 5m)', 57),
  ('herramientas', 'Palas', 58),
  ('herramientas', 'Carpas', 59),
  ('ropa', 'Ropa', 60),
  ('ropa', 'Ropa para bebés', 61),
  ('ropa', 'Ropa interior de niñas', 62),
  ('ropa', 'Ropa interior de niños', 63),
  ('ropa', 'Zapatos', 64),
  ('ropa', 'Medias', 65),
  ('cama', 'Cobijas', 66),
  ('cama', 'Colchonetas', 67),
  ('cama', 'Sábanas', 68),
  ('cama', 'Almohadas', 69),
  ('juguetes', 'Juegos deportivos', 70),
  ('juguetes', 'Juegos lúdicos', 71),
  ('juguetes', 'Legos', 72),
  ('juguetes', 'Juguetes de niñas', 73),
  ('juguetes', 'Juguetes de niños', 74),
  ('colores', 'Creyones de madera', 75),
  ('colores', 'Cuadernos', 76),
  ('colores', 'Lápices', 77),
  ('colores', 'Hojas blancas', 78),
  ('colores', 'Pinta caritas', 79),
  ('otros', 'Envases de comida', 80),
  ('otros', 'Encendedor', 81),
  ('otros', 'Centro de camas', 82)
on conflict do nothing;

-- ---------------------------------------------------------------------------
-- Seed: one approved demo centro.
-- Login password is "centro123" (change or remove for production).
-- ---------------------------------------------------------------------------
insert into public.centros_acopio
  (id, name, slug, address_label, lat, lng, contact_name, contact_phone,
   admin_password_hash, registration_status, approved_at)
values (
  '00000000-0000-4000-8000-000000000001',
  'Centro de Acopio Los Salias (demo)',
  'centro-los-salias-demo',
  'San Antonio de los Altos, Miranda',
  10.3739, -66.9769,
  'Coordinación municipal', '0212-000-0000',
  'c52199d813174fde88202116c60025ab:51d363a2380aed43c9034c52cb6aa13a5dfe9680e7566cca8691acc73086e3e08e51b042b7957e9b0cb841f6da7e69a86abfd3feaeda2e487f3fa617ba8def3a',
  'approved', now()
)
on conflict (id) do nothing;

-- Give the demo centro a spread of statuses across the four levels.
insert into public.product_status (centro_id, product_id, status, updated_by)
select
  '00000000-0000-4000-8000-000000000001',
  p.id,
  (case p.sort_order % 4
     when 0 then 'critico'
     when 1 then 'necesita_mas'
     when 2 then 'suficiente'
     else 'abundante'
   end)::stock_status,
  'Centro admin'
from public.products p
where p.sort_order < 40
on conflict (centro_id, product_id) do nothing;
