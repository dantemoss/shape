-- Saldo real, ajustes y vínculo cobro ↔ ingreso.
-- Correrla después de 20261022180000_expense_source_shortcut.sql,
-- en el SQL Editor de Supabase. No borra movimientos.
-- Se puede volver a correr: si una parte ya quedó aplicada, el resto sigue.
--
-- Qué hace con los datos que ya están:
--   * Si un cobro y un ingreso coinciden en fecha, monto y descripción
--     (el nombre del sueldo, la nota o un texto que dice "sueldo")
--     y el par es único, los vincula.
--   * Si hay más de un candidato, no elige ni borra nada.
--     La pantalla Sueldo los deja para revisar.
--   * No carga el saldo inicial: eso se hace en la app.

-- ── Cuenta (una por usuario; hoy, Mercado Pago en pesos) ────────────────────

create table if not exists public.accounts (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null default 'Mercado Pago',
  currency text not null default 'ARS' check (currency = 'ARS'),
  starting_balance numeric(14, 2) not null,
  starting_date date not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint accounts_user_unique unique (user_id)
);

comment on table public.accounts is
  'Saldo al empezar starting_date, antes de los movimientos de ese día. El saldo de hoy es esa base más ingresos menos gastos en pesos, más los ajustes.';
comment on column public.accounts.starting_balance is
  'Plata en la cuenta al empezar starting_date. Puede ser 0 o negativa.';
comment on column public.accounts.starting_date is
  'Día civil (Argentina). Entran los movimientos con fecha >= starting_date.';

-- ── Ajustes de conciliación (no se pisan; quedan en el historial) ──────────

create table if not exists public.balance_adjustments (
  id uuid primary key default extensions.gen_random_uuid(),
  user_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  account_id uuid not null references public.accounts (id) on delete cascade,
  amount numeric(14, 2) not null,
  date date not null,
  note text,
  balance_before numeric(14, 2) not null,
  balance_after numeric(14, 2) not null,
  created_at timestamptz not null default now()
);

-- El check suelto `amount <> 0` Postgres lo nombra balance_adjustments_amount_check.
-- Por eso la ecuación del saldo lleva otro nombre: si no, el create table choca (42710).
do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'balance_adjustments_amount_nonzero_check'
      and conrelid = 'public.balance_adjustments'::regclass
  ) then
    alter table public.balance_adjustments
      add constraint balance_adjustments_amount_nonzero_check check (amount <> 0);
  end if;
  if not exists (
    select 1 from pg_constraint
    where conname = 'balance_adjustments_equation_check'
      and conrelid = 'public.balance_adjustments'::regclass
  ) then
    alter table public.balance_adjustments
      add constraint balance_adjustments_equation_check
      check (balance_after = balance_before + amount);
  end if;
end $$;

comment on table public.balance_adjustments is
  'Diferencia anotada al ajustar el saldo calculado al saldo real. amount es con signo: positivo suma, negativo resta.';

create index if not exists balance_adjustments_user_date_idx
  on public.balance_adjustments (user_id, date desc);

-- ── Cobro vinculado al ingreso, sin duplicar el período ─────────────────────

alter table public.salary_payments
  add column if not exists income_id uuid,
  add column if not exists period_key date;

comment on column public.salary_payments.income_id is
  'Ingreso del libro que representa este cobro. No es una FK: el borrado en cascada lo hace el trigger para no dejar punteros circulares.';
comment on column public.salary_payments.period_key is
  'Día de cobro configurado que cierra el período (el 25, aunque hayan pagado el 23). Único por usuario.';

alter table public.incomes
  add column if not exists salary_payment_id uuid,
  add column if not exists counts_in_balance boolean not null default true,
  add column if not exists kind text not null default 'regular';

do $$
begin
  if not exists (select 1 from pg_constraint where conname = 'incomes_kind_check') then
    alter table public.incomes
      add constraint incomes_kind_check check (kind in ('regular', 'salary'));
  end if;
  if not exists (select 1 from pg_constraint where conname = 'incomes_salary_payment_id_fkey') then
    alter table public.incomes
      add constraint incomes_salary_payment_id_fkey
      foreign key (salary_payment_id) references public.salary_payments (id) on delete cascade;
  end if;
end $$;

comment on column public.incomes.salary_payment_id is
  'Si este ingreso es un cobro de sueldo, el cobro vinculado. Borrar el cobro borra el ingreso.';
comment on column public.incomes.counts_in_balance is
  'false lo deja guardado pero afuera del saldo. Sirve para una copia duplicada, sin borrarla.';
comment on column public.incomes.kind is
  'regular o salary. El sueldo esperado de la configuración no es una fila: solo cuenta el ingreso real.';

create unique index if not exists salary_payments_user_period_key_idx
  on public.salary_payments (user_id, period_key)
  where period_key is not null;

create unique index if not exists salary_payments_income_id_idx
  on public.salary_payments (income_id)
  where income_id is not null;

create unique index if not exists incomes_salary_payment_id_idx
  on public.incomes (salary_payment_id)
  where salary_payment_id is not null;

-- ── Borrar uno borra el otro ────────────────────────────────────────────────
-- Al borrar el cobro, la FK en cascada borra el ingreso.
-- Al borrar el ingreso, este trigger borra el cobro.
-- El flag evita que la cascada vuelva a entrar.

create or replace function public.mark_salary_pair_delete()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  perform set_config('shape.deleting_salary_pair', '1', true);
  return old;
end;
$$;

create or replace function public.delete_payment_when_income_goes()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if old.salary_payment_id is null then
    return old;
  end if;
  if current_setting('shape.deleting_salary_pair', true) = '1' then
    return old;
  end if;
  perform set_config('shape.deleting_salary_pair', '1', true);
  delete from public.salary_payments
  where id = old.salary_payment_id
    and user_id = old.user_id;
  return old;
end;
$$;

drop trigger if exists salary_payments_mark_delete on public.salary_payments;
create trigger salary_payments_mark_delete
  before delete on public.salary_payments
  for each row execute function public.mark_salary_pair_delete();

drop trigger if exists incomes_delete_salary_payment on public.incomes;
create trigger incomes_delete_salary_payment
  after delete on public.incomes
  for each row execute function public.delete_payment_when_income_goes();

revoke all on function public.mark_salary_pair_delete() from public, anon, authenticated;
revoke all on function public.delete_payment_when_income_goes() from public, anon, authenticated;

drop trigger if exists accounts_set_updated_at on public.accounts;
create trigger accounts_set_updated_at
  before update on public.accounts
  for each row execute function public.set_updated_at();

-- ── Vincular cobros viejos solo cuando no hay duda ─────────────────────────

with pairs as (
  select
    payment.id as payment_id,
    income.id as income_id,
    count(*) over (partition by payment.id) as incomes_for_payment,
    count(*) over (partition by income.id) as payments_for_income
  from public.salary_payments as payment
  join public.salary_configs as config
    on config.user_id = payment.user_id
  join public.incomes as income
    on income.user_id = payment.user_id
   and income.date = payment.date
   and income.amount = payment.amount
   and income.salary_payment_id is null
   and payment.income_id is null
  where income.kind = 'regular'
    and (
      lower(btrim(income.description)) = lower(btrim(config.label))
      or (
        payment.note is not null
        and btrim(payment.note) <> ''
        and lower(btrim(income.description)) = lower(btrim(payment.note))
      )
      or lower(income.description) like '%sueldo%'
    )
),
unique_pairs as (
  select payment_id, income_id
  from pairs
  where incomes_for_payment = 1
    and payments_for_income = 1
)
update public.salary_payments as payment
set income_id = unique_pairs.income_id
from unique_pairs
where payment.id = unique_pairs.payment_id
  and payment.income_id is null;

update public.incomes as income
set
  salary_payment_id = payment.id,
  kind = 'salary'
from public.salary_payments as payment
where payment.income_id = income.id
  and income.salary_payment_id is null;

-- ── Privilegios y RLS ───────────────────────────────────────────────────────

grant select, insert, update, delete on table
  public.accounts,
  public.balance_adjustments
to authenticated;

grant all privileges on table
  public.accounts,
  public.balance_adjustments
to postgres, service_role;

revoke all on table
  public.accounts,
  public.balance_adjustments
from anon;

alter table public.accounts enable row level security;
alter table public.balance_adjustments enable row level security;

drop policy if exists "own_rows" on public.accounts;
create policy "own_rows" on public.accounts
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (user_id = (select auth.uid()));

drop policy if exists "own_rows" on public.balance_adjustments;
create policy "own_rows" on public.balance_adjustments
  for all to authenticated
  using (user_id = (select auth.uid()))
  with check (
    user_id = (select auth.uid())
    and exists (
      select 1 from public.accounts as account
      where account.id = account_id
        and account.user_id = (select auth.uid())
    )
  );
