# Shape

Finanzas personales: sueldo, gastos, tarjetas, suscripciones y metas.

Los datos viven en [Supabase](https://supabase.com). Cada cuenta solo ve sus filas (Row Level Security con `auth.uid()`). La app en producción está en [shape-coral.vercel.app](https://shape-coral.vercel.app/).

## Por qué Supabase Auth

Es una app de una sola persona, pero las políticas de RLS necesitan un `user_id`. Con email y contraseña de Supabase Auth, cada fila queda atada a `auth.uid()` y el navegador solo usa la clave anónima (pública). La clave `service_role` no va al cliente: la usa después el proceso que va a insertar gastos de Mercado Pago, porque esa clave omite RLS.

El ingreso de la app pide email y contraseña. El nombre y la foto siguen en el perfil. Los gastos que llegan desde el iPhone entran por `POST /api/gastos`: el atajo manda un token propio y el servidor escribe en `expenses` con la service role, en la cuenta indicada por `SHAPE_OWNER_USER_ID`.

## 1. Crear el proyecto de Supabase

1. Entrá a [supabase.com/dashboard](https://supabase.com/dashboard) y creá un proyecto.
2. Abrí **SQL Editor → New query**.
3. Pegá y ejecutá, en este orden:
   - `supabase/migrations/20261022160000_init_schema.sql`
   - `supabase/migrations/20261022180000_expense_source_shortcut.sql`

   Si ya habías corrido la primera, alcanza con la segunda. Esa segunda habilita el origen `shortcut` para los gastos del atajo.
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
| `NEXT_PUBLIC_SUPABASE_URL` | Navegador y servidor | URL del proyecto. Next.js la incrusta en el build del cliente. |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Navegador | Clave anónima. RLS impide leer filas de otro usuario. |
| `SUPABASE_SERVICE_ROLE_KEY` | Solo servidor | La usa `POST /api/gastos` para insertar en `expenses`. Omite RLS. No lleva prefijo `NEXT_PUBLIC_`. |
| `SHAPE_INGEST_TOKEN` | Solo servidor | Contraseña del atajo. El iPhone la manda como `Authorization: Bearer <token>`. |
| `SHAPE_OWNER_USER_ID` | Solo servidor | UUID de tu usuario (Authentication → Users). Los gastos del atajo se guardan en esa cuenta. |

En Vercel: **Project → Settings → Environment Variables**. Cargá las cinco para Production (y Preview si hace falta) y volvé a desplegar. Las `NEXT_PUBLIC_` quedan fijas en el build del cliente; las otras tres las lee el endpoint en el servidor. Cambiarlas sin un deploy nuevo no alcanza.

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
| `expenses` | Gastos manuales, del atajo y de Mercado Pago | `user_id`, `amount`, `currency`, `date`, `description`, `merchant`, `category`, `source` (`manual` \| `mercadopago` \| `shortcut`), `external_id`, `recurrence`, cuotas, `legacy_id` |
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

Ese insert va con la **service role** (omite RLS) y tiene que incluir `user_id`. Si `description` viene vacío, la app muestra `merchant`. `category` tiene que existir en `expense_categories` (`other` sirve de respaldo). `currency` es un código de 3 letras; el default es `ARS`. El atajo de iOS no escribe SQL: usa el endpoint de abajo, que ya manda `user_id` y `source: shortcut`.

## Cargar gastos desde el iPhone

El endpoint es:

`POST https://shape-coral.vercel.app/api/gastos`

Encabezado obligatorio:

```http
Authorization: Bearer <SHAPE_INGEST_TOKEN>
Content-Type: application/json
```

Cuerpo:

```json
{
  "amount": "$ 12.345,67",
  "merchant": "YPF",
  "description": "Nafta",
  "category": "transport",
  "date": "2026-10-22",
  "currency": "ARS",
  "source": "shortcut",
  "external_id": "ypf-2026-10-22-12345"
}
```

Obligatorios: `amount` y al menos uno de `merchant` o `description`. El resto es opcional.

| Campo | Si no lo mandás |
| --- | --- |
| `currency` | `ARS` |
| `date` | Hoy en Argentina |
| `source` | `shortcut` |
| `category` | `other` |
| `external_id` | vacío. Si lo repetís, la segunda vez responde 409 y no duplica el gasto. |

El monto puede ser un número (`12345.67`) o un texto argentino (`$ 12.345,67`, `12,50`, `12.345`). También acepta `monto`, `comercio`, `descripcion`, `categoria`, `fecha`, `moneda` y `origen` como nombres de campo. Categorías: `housing`, `food`, `transport`, `entertainment`, `health`, `education`, `subscriptions`, `clothing`, `savings`, `other` (o el nombre en español, como `comida`).

Respuestas JSON:

| Código | Cuándo |
| --- | --- |
| 201 | Gasto guardado. El cuerpo incluye `id`, `amount`, `merchant` y el resto. |
| 400 | JSON, monto, fecha o categoría que no se puede leer. `error` dice qué falló. |
| 401 | Falta el Bearer o el token no coincide. |
| 409 | Ese `external_id` ya estaba cargado. |
| 500 | Falta una variable de servidor. |
| 502 | Supabase no pudo guardar el gasto. |

El atajo solo guarda `SHAPE_INGEST_TOKEN`. La service role y el UUID se quedan en Vercel.

### Atajo para cargar un gasto a mano

1. Abrí **Atajos** y tocá **+**.
2. Tocá el nombre y renombralo a **Cargar gasto**.
3. **Agregar acción** → buscá **Pedir entrada**. Pregunta: `¿Cuánto?`. Tipo: **Texto** (así podés escribir `12.345,67`). Tocá **Entrada proporcionada**, elegí **Renombrar** y poné `Monto`.
4. Otra **Pedir entrada**. Pregunta: `¿Dónde?`. Tipo: **Texto**. Renombrá la salida a `Comercio`.
5. **Agregar acción** → buscá **Obtener contenido de URL** (en un iPhone en inglés: *Get Contents of URL*).
6. En URL pegá `https://shape-coral.vercel.app/api/gastos`.
7. Tocá la flecha de la acción para abrir el detalle.
8. **Método**: POST.
9. **Encabezados** → **Agregar nuevo encabezado**.
   - Clave: `Authorization`
   - Valor: `Bearer ` y, pegado, el valor de `SHAPE_INGEST_TOKEN`. Tiene que haber un espacio después de `Bearer`. Ejemplo: `Bearer mi-token-largo`.
10. **Cuerpo de la solicitud**: JSON.
11. **Agregar nuevo campo**:
    - Clave `amount`. En el valor, tocá y elegí la variable **Monto**.
    - Clave `merchant`. En el valor, elegí **Comercio**.
12. Opcional, para no duplicar si lo corrés dos veces: agregá una acción **Texto** antes del POST, con `Comercio-Monto-Fecha` (insertá las variables), renombrala `Referencia`, y en el JSON sumá la clave `external_id` con esa variable.
13. Opcional: al final, **Mostrar resultado** con el contenido de la URL. Si salió bien ves `"id"`. Si falló ves `"error"`.

### Automatización de Cartera (Wallet)

Cuando pagás con Apple Pay o con una tarjeta de Wallet, iOS puede disparar el atajo con el monto y el comercio de la transacción.

1. En **Atajos**, abrí la pestaña **Automatización** → **+** → **Crear automatización personal**.
2. Buscá **Transacción** (en inglés: *Transaction*). Está entre las de Cartera.
3. Elegí las tarjetas y que corra cuando hay un gasto.
4. Elegí **Ejecutar inmediatamente**. Si aparece **Preguntar antes de ejecutar**, desactivalo. iOS a veces igual pide confirmación la primera vez que un atajo manda datos afuera; es un límite del sistema.
5. En el atajo que se abre, la entrada es la **Transacción**.
6. **Agregar acción** → **Obtener detalles de Transacciones** (*Get Details of Transactions*). Detalle: **Monto**.
7. Otra igual, con detalle **Comercio**.
8. Si el detalle **Fecha** está en la lista, agregalo también.
9. **Obtener contenido de URL**, igual que en el atajo de arriba: POST, encabezado `Authorization: Bearer <token>`, cuerpo JSON.
10. En el JSON:
    - `amount` → el detalle **Monto**
    - `merchant` → el detalle **Comercio**
    - `date` → el detalle **Fecha**, solo si lo agregaste. Si no, Shape usa el día de hoy en Argentina.
11. Recomendado: una acción **Texto** con `Comercio-Monto-Fecha` y mandala como `external_id`, para que la misma transacción no se cargue dos veces.

No hace falta pedir el monto a mano: Wallet ya lo trae. Si el atajo responde 409, ese pago ya estaba en Shape.
