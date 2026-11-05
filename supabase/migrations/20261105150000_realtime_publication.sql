-- Avisa a las otras sesiones cuando cambia una fila tuya.
-- No abre datos: Realtime usa el JWT y RLS sigue filtrando por auth.uid().
-- Si no corrés este archivo, la app igual relee al volver a la pestaña
-- y mientras la pestaña está visible. Esto solo lo hace inmediato.
--
-- No borra filas ni toca políticas.

do $$
declare
  tbl text;
begin
  if not exists (select 1 from pg_publication where pubname = 'supabase_realtime') then
    raise notice 'No existe la publicación supabase_realtime. La app sigue releyendo sola.';
    return;
  end if;

  foreach tbl in array array[
    'expenses',
    'incomes',
    'goals',
    'salary_configs',
    'salary_payments',
    'credit_cards',
    'card_installments',
    'subscriptions',
    'accounts',
    'balance_adjustments',
    'profiles'
  ]
  loop
    if to_regclass(format('public.%I', tbl)) is null then
      continue;
    end if;

    if not exists (
      select 1
      from pg_publication_tables
      where pubname = 'supabase_realtime'
        and schemaname = 'public'
        and tablename = tbl
    ) then
      execute format('alter publication supabase_realtime add table public.%I', tbl);
    end if;

    execute format('alter table public.%I replica identity full', tbl);
  end loop;
end $$;
