-- Cierra el acceso: RLS forzado y una política por operación.
-- No borra filas. No pisa un user_id que ya apunta a un usuario.
--
-- Orden, en el SQL Editor (después de las migraciones anteriores):
--   1. Corré este archivo entero.
--   2. Mirá tus usuarios:
--        select id, email from auth.users order by created_at;
--   3. Si hay UNA sola cuenta, el paso 1 ya asignó los user_id nulos a esa cuenta.
--      Si hay más de una, no adivina. Para colgar solo las filas sin dueño
--      de TU usuario (no toca las filas de otra persona):
--        select * from public.claim_orphan_rows('<uuid de auth.users>');
--
-- expense_categories no lleva user_id: es el catálogo fijo (food, housing, …)
-- que referencian los gastos. RLS está activo, solo se puede leer, y
-- anon/authenticated no pueden escribir.

-- ── Dueño único, sin adivinar si hay varias cuentas ─────────────────────────

create or replace function public.shape_single_owner()
returns uuid
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  ids uuid[];
begin
  select array_agg(id) into ids from auth.users;
  if ids is null or cardinality(ids) <> 1 then
    return null;
  end if;
  return ids[1];
end;
$$;

revoke all on function public.shape_single_owner() from public, anon, authenticated, service_role;

-- Asigna filas con user_id nulo al usuario indicado.
-- Si el id no existe en auth.users, no cambia nada y avisa.
create or replace function public.claim_orphan_rows(owner uuid)
returns table(table_name text, updated_rows bigint)
language plpgsql
security definer
set search_path = public
as $$
declare
  updated bigint;
begin
  if owner is null or not exists (select 1 from auth.users where id = owner) then
    raise exception 'Ese id no está en auth.users. No se cambió ninguna fila.';
  end if;

  update public.expenses set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'expenses'; updated_rows := updated; return next;

  update public.incomes set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'incomes'; updated_rows := updated; return next;

  update public.salary_payments set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'salary_payments'; updated_rows := updated; return next;

  update public.goals set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'goals'; updated_rows := updated; return next;

  update public.credit_cards set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'credit_cards'; updated_rows := updated; return next;

  update public.card_installments set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'card_installments'; updated_rows := updated; return next;

  update public.subscriptions set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'subscriptions'; updated_rows := updated; return next;

  update public.balance_adjustments set user_id = owner where user_id is null;
  get diagnostics updated = row_count;
  table_name := 'balance_adjustments'; updated_rows := updated; return next;

  -- Una fila por usuario. Si el dueño ya tiene la suya, la fila nula se deja
  -- para no pisar el sueldo ni el saldo.
  update public.salary_configs set user_id = owner
  where user_id is null
    and not exists (select 1 from public.salary_configs as existing where existing.user_id = owner);
  get diagnostics updated = row_count;
  table_name := 'salary_configs'; updated_rows := updated; return next;

  update public.accounts set user_id = owner
  where user_id is null
    and not exists (select 1 from public.accounts as existing where existing.user_id = owner);
  get diagnostics updated = row_count;
  table_name := 'accounts'; updated_rows := updated; return next;

  insert into public.profiles (id, name)
  select owner, ''
  where not exists (select 1 from public.profiles where id = owner);
  get diagnostics updated = row_count;
  table_name := 'profiles'; updated_rows := updated; return next;
end;
$$;

revoke all on function public.claim_orphan_rows(uuid) from public, anon, authenticated, service_role;

-- ── RLS forzado en las tablas de la app ─────────────────────────────────────

alter table public.profiles enable row level security;
alter table public.profiles force row level security;
alter table public.expense_categories enable row level security;
alter table public.expense_categories force row level security;
alter table public.expenses enable row level security;
alter table public.expenses force row level security;
alter table public.incomes enable row level security;
alter table public.incomes force row level security;
alter table public.salary_configs enable row level security;
alter table public.salary_configs force row level security;
alter table public.salary_payments enable row level security;
alter table public.salary_payments force row level security;
alter table public.goals enable row level security;
alter table public.goals force row level security;
alter table public.credit_cards enable row level security;
alter table public.credit_cards force row level security;
alter table public.card_installments enable row level security;
alter table public.card_installments force row level security;
alter table public.subscriptions enable row level security;
alter table public.subscriptions force row level security;
alter table public.accounts enable row level security;
alter table public.accounts force row level security;
alter table public.balance_adjustments enable row level security;
alter table public.balance_adjustments force row level security;

-- ── Catálogo compartido: se lee, no se escribe ──────────────────────────────

drop policy if exists "read_categories" on public.expense_categories;
drop policy if exists "categories_select" on public.expense_categories;
create policy "categories_select" on public.expense_categories
  for select to authenticated
  using (true);

revoke insert, update, delete on table public.expense_categories from anon, authenticated;

-- ── Perfil: el id es el usuario ─────────────────────────────────────────────

drop policy if exists "own_profile" on public.profiles;
drop policy if exists "profiles_select" on public.profiles;
drop policy if exists "profiles_insert" on public.profiles;
drop policy if exists "profiles_update" on public.profiles;
drop policy if exists "profiles_delete" on public.profiles;

create policy "profiles_select" on public.profiles
  for select to authenticated
  using (id = (select auth.uid()));

create policy "profiles_insert" on public.profiles
  for insert to authenticated
  with check (id = (select auth.uid()));

create policy "profiles_update" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "profiles_delete" on public.profiles
  for delete to authenticated
  using (id = (select auth.uid()));

-- ── Tablas con user_id ──────────────────────────────────────────────────────

create or replace function public.shape_apply_owner_policies(target regclass)
returns void
language plpgsql
as $$
declare
  rel text := target::text;
begin
  execute format('drop policy if exists "own_rows" on %s', rel);
  execute format('drop policy if exists "owner_select" on %s', rel);
  execute format('drop policy if exists "owner_insert" on %s', rel);
  execute format('drop policy if exists "owner_update" on %s', rel);
  execute format('drop policy if exists "owner_delete" on %s', rel);

  execute format(
    'create policy "owner_select" on %s for select to authenticated using (user_id = (select auth.uid()))',
    rel
  );
  execute format(
    'create policy "owner_insert" on %s for insert to authenticated with check (user_id = (select auth.uid()))',
    rel
  );
  execute format(
    'create policy "owner_update" on %s for update to authenticated using (user_id = (select auth.uid())) with check (user_id = (select auth.uid()))',
    rel
  );
  execute format(
    'create policy "owner_delete" on %s for delete to authenticated using (user_id = (select auth.uid()))',
    rel
  );
end;
$$;

select public.shape_apply_owner_policies('public.expenses'::regclass);
select public.shape_apply_owner_policies('public.incomes'::regclass);
select public.shape_apply_owner_policies('public.salary_configs'::regclass);
select public.shape_apply_owner_policies('public.salary_payments'::regclass);
select public.shape_apply_owner_policies('public.goals'::regclass);
select public.shape_apply_owner_policies('public.credit_cards'::regclass);
select public.shape_apply_owner_policies('public.subscriptions'::regclass);
select public.shape_apply_owner_policies('public.accounts'::regclass);

-- Cuotas: además, la tarjeta tiene que ser tuya.
drop policy if exists "own_rows" on public.card_installments;
drop policy if exists "owner_select" on public.card_installments;
drop policy if exists "owner_insert" on public.card_installments;
drop policy if exists "owner_update" on public.card_installments;
drop policy if exists "owner_delete" on public.card_installments;

create policy "owner_select" on public.card_installments
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.credit_cards as card
      where card.id = card_id and card.user_id = (select auth.uid())
    )
  );

create policy "owner_insert" on public.card_installments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.credit_cards as card
      where card.id = card_id and card.user_id = (select auth.uid())
    )
  );

create policy "owner_update" on public.card_installments
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.credit_cards as card
      where card.id = card_id and card.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.credit_cards as card
      where card.id = card_id and card.user_id = (select auth.uid())
    )
  );

create policy "owner_delete" on public.card_installments
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.credit_cards as card
      where card.id = card_id and card.user_id = (select auth.uid())
    )
  );

-- Ajustes: la cuenta tiene que ser tuya.
drop policy if exists "own_rows" on public.balance_adjustments;
drop policy if exists "owner_select" on public.balance_adjustments;
drop policy if exists "owner_insert" on public.balance_adjustments;
drop policy if exists "owner_update" on public.balance_adjustments;
drop policy if exists "owner_delete" on public.balance_adjustments;

create policy "owner_select" on public.balance_adjustments
  for select to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts as account
      where account.id = account_id and account.user_id = (select auth.uid())
    )
  );

create policy "owner_insert" on public.balance_adjustments
  for insert to authenticated
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts as account
      where account.id = account_id and account.user_id = (select auth.uid())
    )
  );

create policy "owner_update" on public.balance_adjustments
  for update to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts as account
      where account.id = account_id and account.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts as account
      where account.id = account_id and account.user_id = (select auth.uid())
    )
  );

create policy "owner_delete" on public.balance_adjustments
  for delete to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts as account
      where account.id = account_id and account.user_id = (select auth.uid())
    )
  );

revoke all on function public.shape_apply_owner_policies(regclass) from public, anon, authenticated, service_role;

-- ── Filas sin dueño: solo si hay una cuenta ─────────────────────────────────

do $$
declare
  owner uuid;
begin
  owner := public.shape_single_owner();
  if owner is null then
    raise notice 'No reasigné filas: o no hay usuarios, o hay más de uno. Si hace falta, corré select * from public.claim_orphan_rows(''<tu uuid>'');';
    return;
  end if;
  perform public.claim_orphan_rows(owner);
end $$;
