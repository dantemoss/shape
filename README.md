# Shape

Finanzas personales: sueldo, gastos, tarjetas, suscripciones y metas.

Los datos viven en [Supabase](https://supabase.com). Cada cuenta solo ve sus filas (Row Level Security con `auth.uid()`). La app en producción está en [shape-coral.vercel.app](https://shape-coral.vercel.app/).

## Por qué Supabase Auth

Es una app de una sola persona, pero las políticas de RLS necesitan un `user_id`. Con email y contraseña de Supabase Auth, cada fila queda atada a `auth.uid()` y el navegador solo usa la clave anónima (pública). La clave `service_role` no va al cliente: la usa después el proceso que va a insertar gastos de Mercado Pago, porque esa clave omite RLS.

El ingreso de la app pide email y contraseña. El nombre y la foto siguen en el perfil.

## 1. Crear el proyecto de Supabase

1. Entrá a [supabase.com/dashboard](https://supabase.com/dashboard) y creá un proyecto.
2. Abrí **SQL Editor → New query**.
3. Pegá el contenido de `supabase/migrations/20261022160000_init_schema.sql` y ejecútalo una vez.
4. En **Project Settings → API** copiá:
   - Project URL
   - `anon` `public` key
5. En **Authentication → Providers → Email**, dejá el proveedor habilitado.
6. Para entrar apenas creás la cuenta, desactivá **Confirm email** en **Authentication → Sign In / Providers** (o **Email → Confirm email**). Si lo dejás activo, Shape pide confirmar el mail y después ingresar. La URL del sitio tiene que ser `https://shape-coral.vercel.app` (**Authentication → URL Configuration → Site URL**). Sumá `http://localhost:3000` en **Redirect URLs** si vas a probar en local.

El usuario se crea desde la pantalla de Shape (**Crear cuenta**). El UUID queda en **Authentication → Users** y es el `user_id` que va a necesitar el insert de Mercado Pago.

## 2. Variables de entorno

Copiá `.env.example` a `.env.local`:

```bash
cp .env.example .env.local
```

| Variable | Dónde | Para qué |
| --- | --- | --- |
| `NEXT_PUBLIC_SUPABASE_URL` | Navegador | URL del proyecto. Next.js la incrusta en el build. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Navegador | Clave anónima. RLS impide leer filas de otro usuario. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor, más adelante | Inserts de Mercado Pago. No lleva prefijo `NEXT_PUBLIC_` y esta app no la lee. |

En Vercel: **Project → Settings → Environment Variables**. Cargá las dos `NEXT_PUBLIC_` para Production (y Preview si hace falta) y volvé a desplegar. Next.js las fija en el build; cambiarlas sin un deploy nuevo no alcanza.

No subas claves reales. `.env.local` está en `.gitignore`. `.env.example` solo tiene placeholders.

## 3. Desarrollo

```bash
npm install
npm run dev
```

Abrí [http://localhost:3000](http://localhost:3000).

## Datos que ya estaban en el navegador

Antes, Zustand guardaba todo en `localStorage` bajo la clave `shape-storage`. La primera vez que entrás con tu cuenta en ese navegador, Shape copia esos datos a Supabase (movimientos, sueldo, tarjetas, cuotas, suscripciones, metas y, si el perfil nuevo está vacío, nombre y foto).

La copia usa el id viejo (`legacy_id`) para no duplicar si se reintenta. El `localStorage` original no se borra. Si la importación falla, el perfil muestra **Importar datos locales**.

## Esquema

| Tabla | Qué guarda | Columnas principales |
| --- | --- | --- |
| `profiles` | Nombre y foto | `id` (= `auth.users.id`), `name`, `avatar` |
| `expense_categories` | Categorías fijas de la app | `id` (`food`, `housing`, …), `label` |
| `expenses` | Gastos manuales y, después, Mercado Pago | `user_id`, `amount`, `currency`, `date`, `description`, `merchant`, `category`, `source` (`manual` \| `mercadopago`), `external_id`, `recurrence`, cuotas, `legacy_id` |
| `incomes` | Ingresos cargados a mano (incluido el cobro de sueldo) | `user_id`, `amount`, `currency`, `date`, `description`, `category`, `recurrence` |
| `salary_configs` | Un sueldo por usuario | `user_id`, `amount`, `frequency`, `pay_day`, `pay_day_2`, `label` |
| `salary_payments` | Historial de cobros | `user_id`, `amount`, `date`, `note` |
| `goals` | Metas | `name`, `target_amount`, `current_amount`, `deadline` |
| `credit_cards` | Tarjetas | `label`, `network`, `issuer_key`, `credit_limit`, `used_amount`, `last_four_digits` |
| `card_installments` | Planes de cuotas | `card_id`, `description`, `total_amount`, `total_installments`, `paid_installments`, `start_date` |
| `subscriptions` | Suscripciones | `name`, `domain`, `price`, `currency`, `period`, `start_date`, `active`, `category` |

`external_id` es único junto con `user_id` y puede ser null. Varios gastos manuales con `external_id` vacío conviven. Para no duplicar un pago importado:

```sql
insert into public.expenses (
  user_id, amount, currency, date, merchant, description, category, source, external_id
) values (
  '<uuid del usuario>',
  1500,
  'ARS',
  '2026-10-22',
  'Nombre del comercio',
  'Nombre del comercio',
  'other',
  'mercadopago',
  'id-del-pago'
)
on conflict (user_id, external_id) do nothing;
```

Ese insert va con la **service role** (omite RLS) y tiene que incluir `user_id`. Si `description` viene vacío, la app muestra `merchant`. `category` tiene que existir en `expense_categories` (`other` sirve de respaldo). `currency` es un código de 3 letras; el default es `ARS`.

Para sumar otro origen más adelante:

```sql
alter table public.expenses drop constraint expenses_source_check;
alter table public.expenses add constraint expenses_source_check
  check (source in ('manual', 'mercadopago'));
```
