-- Shape: persistencia en Supabase.
-- Cubre todo lo que hoy vive en localStorage (clave "shape-storage")
-- y deja `public.expenses` listo para inserts de servidor (Mercado Pago).
--
-- Cómo correrlo: SQL Editor del proyecto, o `supabase db push`.
-- La service role omite RLS. Un insert de servidor tiene que mandar `user_id`,
-- porque en ese contexto `auth.uid()` es null y la columna es NOT NULL.

create extension if not exists pgcrypto with schema extensions;

-- ── Categorías de gasto (las mismas que usa la app) ─────────────────────────

create table public.expense_categories (
  id text primary key,
  label text not null,
  sort_order integer not null
);

insert into public.expense_categories (id, label, sort_order) values
  ('housing', 'Vivienda', 10),
  ('food', 'Comida', 20),
  ('transport', 'Transporte', 30),
  ('entertainment', 'Entretenimiento', 40),
  ('health', 'Salud', 50),
  ('education', 'Educación', 60),
  ('subscriptions', 'Suscripciones', 70),
  ('clothing', 'Ropa', 80),
  ('savings', 'Ahorro', 90),
  ('other', 'Otro', 100);

-- ── Perfil ──────────────────────────────────────────────────────────────────

create table public.profiles (
  id uuid primary key references auth.users (id) on delete cascade,
  name text not null default '',
  avatar text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── Gastos ──────────────────────────────────────────────────────────────────
-- Insert mínimo desde el servidor:
--   insert into public.expenses (user_id, amount, date, merchant, description, source, external_id)
--   values ('<uuid>', 1500, '2026-10-22', 'Comercio', 'Comercio', 'mercadopago', 'mp-123')
--   on conflict (user_id, external_id) do nothing;
--
-- external_id es único por usuario. Los NULL (gastos manuales) no chocan entre sí.

create table public.expenses (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  date date not null default current_date,
  description text not null default '',
  merchant text,
  category text not null default 'other' references public.expense_categories (id),
  source text not null default 'manual',
  external_id text,
  recurrence text not null default 'once' check (recurrence in ('once', 'monthly', 'weekly', 'yearly')),
  has_installments boolean not null default false,
  total_installments integer check (total_installments is null or total_installments > 0),
  current_installment integer check (current_installment is null or current_installment > 0),
  card_name text,
  legacy_id text,
  created_at timestamptz not null default now(),
  constraint expenses_source_check check (source in ('manual', 'mercadopago')),
  constraint expenses_user_external_id_key unique (user_id, external_id),
  constraint expenses_user_legacy_id_key unique (user_id, legacy_id)
);

comment on table public.expenses is
  'Gastos manuales e importados. Mercado Pago inserta con la service role (omite RLS) y debe incluir user_id.';
comment on column public.expenses.merchant is
  'Comercio. Si description viene vacío, la app muestra este valor.';
comment on column public.expenses.source is
  'Origen del gasto: manual o mercadopago.';
comment on column public.expenses.external_id is
  'Id externo para deduplicar (p. ej. id de pago de Mercado Pago). Nulo en gastos manuales. Único junto con user_id.';
comment on column public.expenses.legacy_id is
  'Id del registro en localStorage. Sirve para importar una sola vez.';

create index expenses_user_date_idx on public.expenses (user_id, date desc);
create index expenses_user_source_idx on public.expenses (user_id, source);
create index expenses_external_id_idx on public.expenses (external_id) where external_id is not null;

-- ── Ingresos (movimientos type = income; el sueldo configurado va aparte) ──

create table public.incomes (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  date date not null default current_date,
  description text not null default '',
  category text not null default 'other' references public.expense_categories (id),
  recurrence text not null default 'once' check (recurrence in ('once', 'monthly', 'weekly', 'yearly')),
  legacy_id text,
  created_at timestamptz not null default now(),
  constraint incomes_user_legacy_id_key unique (user_id, legacy_id)
);

create index incomes_user_date_idx on public.incomes (user_id, date desc);

-- ── Sueldo ──────────────────────────────────────────────────────────────────

create table public.salary_configs (
  user_id uuid primary key references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  currency text not null default 'ARS' check (currency ~ '^[A-Z]{3}$'),
  frequency text not null check (frequency in ('monthly', 'biweekly', 'weekly')),
  pay_day integer not null check (pay_day between 0 and 31),
  pay_day_2 integer check (pay_day_2 is null or pay_day_2 between 1 and 31),
  label text not null default 'Mi sueldo',
  updated_at timestamptz not null default now()
);

create table public.salary_payments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  amount numeric(14, 2) not null check (amount > 0),
  date date not null default current_date,
  note text,
  legacy_id text,
  created_at timestamptz not null default now(),
  constraint salary_payments_user_legacy_id_key unique (user_id, legacy_id)
);

create index salary_payments_user_date_idx on public.salary_payments (user_id, date desc);

-- ── Metas ───────────────────────────────────────────────────────────────────

create table public.goals (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  target_amount numeric(14, 2) not null,
  current_amount numeric(14, 2) not null default 0,
  deadline date,
  emoji text,
  legacy_id text,
  created_at timestamptz not null default now(),
  constraint goals_amounts_check check (
    target_amount > 0
    and current_amount >= 0
    and current_amount <= target_amount
  ),
  constraint goals_user_legacy_id_key unique (user_id, legacy_id)
);

create index goals_user_idx on public.goals (user_id);

-- ── Tarjetas y cuotas ───────────────────────────────────────────────────────

create table public.credit_cards (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  label text not null,
  network text not null check (network in ('visa', 'mastercard', 'amex')),
  issuer_key text not null,
  credit_limit numeric(14, 2) not null default 0 check (credit_limit >= 0),
  used_amount numeric(14, 2) not null default 0 check (used_amount >= 0),
  last_four_digits text,
  color text,
  legacy_id text,
  created_at timestamptz not null default now(),
  constraint credit_cards_user_legacy_id_key unique (user_id, legacy_id)
);

create index credit_cards_user_idx on public.credit_cards (user_id);

create table public.card_installments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  card_id uuid not null references public.credit_cards (id) on delete cascade,
  description text not null,
  total_amount numeric(14, 2) not null check (total_amount > 0),
  total_installments integer not null,
  paid_installments integer not null default 0,
  start_date date not null,
  legacy_id text,
  created_at timestamptz not null default now(),
  constraint card_installments_counts_check check (
    total_installments > 0
    and paid_installments >= 0
    and paid_installments <= total_installments
  ),
  constraint card_installments_user_legacy_id_key unique (user_id, legacy_id)
);

create index card_installments_user_idx on public.card_installments (user_id);
create index card_installments_card_idx on public.card_installments (card_id);

-- ── Suscripciones ───────────────────────────────────────────────────────────

create table public.subscriptions (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null,
  domain text not null default '',
  price numeric(14, 2) not null check (price > 0),
  currency text not null check (currency in ('ARS', 'USD')),
  period text not null check (period in ('monthly', 'yearly', 'weekly')),
  start_date date not null,
  active boolean not null default true,
  category text not null check (category in (
    'streaming', 'productivity', 'food', 'music', 'storage', 'gaming', 'other'
  )),
  legacy_id text,
  created_at timestamptz not null default now(),
  constraint subscriptions_user_legacy_id_key unique (user_id, legacy_id)
);

create index subscriptions_user_idx on public.subscriptions (user_id);

-- ── updated_at ──────────────────────────────────────────────────────────────

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger profiles_set_updated_at
  before update on public.profiles
  for each row execute function public.set_updated_at();

create trigger salary_configs_set_updated_at
  before update on public.salary_configs
  for each row execute function public.set_updated_at();

-- ── Perfil al crear la cuenta ───────────────────────────────────────────────

create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.profiles (id, name)
  values (
    new.id,
    coalesce(nullif(new.raw_user_meta_data ->> 'name', ''), split_part(new.email, '@', 1), '')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

revoke all on function public.handle_new_user() from public, anon, authenticated;
revoke all on function public.set_updated_at() from public, anon, authenticated;

-- ── Privilegios ─────────────────────────────────────────────────────────────

grant usage on schema public to authenticated, service_role;

grant select on table public.expense_categories to authenticated;
grant select, insert, update, delete on table
  public.profiles,
  public.expenses,
  public.incomes,
  public.salary_configs,
  public.salary_payments,
  public.goals,
  public.credit_cards,
  public.card_installments,
  public.subscriptions
to authenticated;

grant all privileges on table
  public.profiles,
  public.expense_categories,
  public.expenses,
  public.incomes,
  public.salary_configs,
  public.salary_payments,
  public.goals,
  public.credit_cards,
  public.card_installments,
  public.subscriptions
to postgres, service_role;

revoke all on table
  public.profiles,
  public.expense_categories,
  public.expenses,
  public.incomes,
  public.salary_configs,
  public.salary_payments,
  public.goals,
  public.credit_cards,
  public.card_installments,
  public.subscriptions
from anon;

-- ── RLS: cada fila pertenece al usuario autenticado ─────────────────────────

alter table public.profiles enable row level security;
alter table public.expense_categories enable row level security;
alter table public.expenses enable row level security;
alter table public.incomes enable row level security;
alter table public.salary_configs enable row level security;
alter table public.salary_payments enable row level security;
alter table public.goals enable row level security;
alter table public.credit_cards enable row level security;
alter table public.card_installments enable row level security;
alter table public.subscriptions enable row level security;

create policy "own_profile" on public.profiles
  for all to authenticated
  using (id = (select auth.uid()))
  with check (id = (select auth.uid()));

create policy "read_categories" on public.expense_categories
  for select to authenticated
  using (true);

create policy "own_rows" on public.expenses
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own_rows" on public.incomes
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own_rows" on public.salary_configs
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own_rows" on public.salary_payments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own_rows" on public.goals
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own_rows" on public.credit_cards
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

create policy "own_rows" on public.card_installments
  for all to authenticated
  using (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.credit_cards as card
      where card.id = card_id
        and card.user_id = (select auth.uid())
    )
  )
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.credit_cards as card
      where card.id = card_id
        and card.user_id = (select auth.uid())
    )
  );

create policy "own_rows" on public.subscriptions
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));
