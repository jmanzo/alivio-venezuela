-- Pre-launch fixes (see PRD-pre-launch-fixes.md). Run this in the Supabase SQL
-- editor after 0001_init.sql. Safe to re-run.

-- ---------------------------------------------------------------------------
-- 1.1 Fix public reads / Realtime on product_status.
--
-- The original policy used an EXISTS subquery against centros_acopio, but that
-- table has RLS enabled with no anon SELECT policy, so the subquery always came
-- back empty for anon: the browser could never read (or receive Realtime events
-- for) any product_status row. A SECURITY DEFINER helper checks approval with
-- the function owner's privileges without exposing any centros_acopio columns
-- (in particular admin_password_hash) to anon.
-- ---------------------------------------------------------------------------
create or replace function public.centro_is_approved(cid uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1 from public.centros_acopio
    where id = cid and registration_status = 'approved'
  );
$$;

revoke all on function public.centro_is_approved(uuid) from public;
grant execute on function public.centro_is_approved(uuid) to anon, authenticated;

drop policy if exists "public read approved status" on public.product_status;
create policy "public read approved status" on public.product_status
  for select using (public.centro_is_approved(centro_id));

-- ---------------------------------------------------------------------------
-- 2.4 / 3.1 Product uniqueness (also makes the 0001 seed idempotent).
-- Case-insensitive per category; accent-insensitive matching is enforced in the
-- application layer, this index is the database-side safety net.
-- ---------------------------------------------------------------------------
create unique index if not exists products_category_name_unique
  on public.products (category_id, lower(name));
