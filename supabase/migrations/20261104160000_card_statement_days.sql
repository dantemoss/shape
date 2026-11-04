-- Días de cierre y vencimiento del resumen.
-- Las columnas son nulas: las tarjetas que ya existen siguen válidas
-- y la app no las exige para mostrar la tarjeta.
--
-- Correr en el SQL Editor del proyecto, o con `supabase db push`,
-- antes de guardar una tarjeta con estos días.

alter table public.credit_cards
  add column if not exists closing_day smallint,
  add column if not exists due_day smallint;

alter table public.credit_cards
  drop constraint if exists credit_cards_closing_day_check;

alter table public.credit_cards
  add constraint credit_cards_closing_day_check
  check (closing_day is null or closing_day between 1 and 31);

alter table public.credit_cards
  drop constraint if exists credit_cards_due_day_check;

alter table public.credit_cards
  add constraint credit_cards_due_day_check
  check (due_day is null or due_day between 1 and 31);

comment on column public.credit_cards.closing_day is
  'Día del mes en que cierra el resumen. Nulo si no se cargó.';

comment on column public.credit_cards.due_day is
  'Día del mes en que vence el pago. Nulo si no se cargó.';
