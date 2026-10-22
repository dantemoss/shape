-- Permite gastos cargados desde el atajo de iOS (POST /api/gastos).
-- Correrla después de 20261022160000_init_schema.sql.

alter table public.expenses drop constraint expenses_source_check;

alter table public.expenses
  add constraint expenses_source_check
  check (source in ('manual', 'mercadopago', 'shortcut'));

comment on column public.expenses.source is
  'Origen del gasto: manual, mercadopago o shortcut (atajo de iOS).';
