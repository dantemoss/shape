# Diseño de Shape

Fuente única para cualquiera que toque la UI. Si este archivo y el código discrepan, el código manda y hay que actualizar este documento en el mismo cambio.

No copies archivos, componentes ni el registro de Mebius. La licencia de Mebius no permite publicar esos archivos, y este repositorio es público. La referencia es solo visual. El código es original.

## 1. Principios

Shape se siente calmo, preciso y con aire. Tarjetas blancas, números grandes, un solo acento por gráfico, mucho gris.

No hagas "AI slop":

- No pongas un ícono del mismo tono que el círculo de atrás.
- No uses fondos shader, gradientes de demostración ni tipografía mono en la interfaz.
- No dejes etiquetas en mayúsculas chiquitas (`text-[10px] uppercase tracking-wider`).
- No estires un gráfico al ancho de la ventana.
- No repitas el mismo número en dos lugares de la misma pantalla.
- Una idea por línea. La explicación larga va detrás de un ícono de info, no en un párrafo.

## 2. Tokens

Están en `src/app/globals.css`. Tailwind v4 los expone con `@theme inline` (`bg-background`, `text-income`, `border-border`, etc.).

### Superficies

| Token | Valor en `:root` | Uso |
| --- | --- | --- |
| `--background` | `oklch(0.972 0.003 260)` | Fondo de la app |
| `--card` / `--popover` | `oklch(1 0 0)` | Tarjetas y popovers |
| `--secondary` / `--muted` / `--accent` | `oklch(0.965 0.003 260)` | Fondos suaves |
| `--sidebar` | `oklch(0.97 0 0)` | Sidebar |

Literales que usa la UI actual y hay que respetar:

| Uso | Valor |
| --- | --- |
| Tarjeta (`.viz-card`) | `#fff` |
| Pozo de ícono | `#f4f5f7` |
| Botón `···` y chips | `#f5f6f8` / `#f4f5f7` |
| Fila de leyenda | `#f6f7f9` |
| Activo del nav | `#f3f4f6` |

### Texto

| Token | Valor | Uso |
| --- | --- | --- |
| `--foreground` | `oklch(0.22 0.02 265)` | Texto principal del tema |
| `--muted-foreground` | `oklch(0.58 0.012 260)` | Texto secundario del tema |

Literales de las tarjetas:

| Rol | Color |
| --- | --- |
| Título y número hero | `#16181d` / `#1c1f26` |
| Cuerpo | `#3a4150` / `#6d7480` |
| Etiqueta | `#9aa1ab` |
| Caption | `#8b919c` / `#b0b6bf` |

### Bordes

| Token | Valor |
| --- | --- |
| `--border` / `--input` | `oklch(0.92 0.004 260)` |
| `--ring` | `oklch(0.72 0.02 260)` |

Borde de ícono y de tarjeta: `border-black/[0.06]` o `ring-1 ring-black/[0.04]`. No uses un borde de color.

### Acento, ingresos y gastos

| Token | Valor | Uso |
| --- | --- | --- |
| `--brand` | `#2F48A1` | Botón primario (`bg-brand`) |
| `--brand-foreground` | `#ffffff` | Texto sobre el botón |
| `--income` | `oklch(0.55 0.15 162)` | Montos que entran |
| `--income-foreground` | `oklch(0.97 0.02 162)` | Texto sobre fondo income |
| `--expense` / `--destructive` | `oklch(0.577 0.245 27.325)` | Montos que salen y acciones destructivas |
| `--expense-foreground` | `oklch(0.97 0.02 27)` | Texto sobre fondo expense |

Verdes y rojos literales de gráficos (no los mezcles con el ícono):

| Uso | Hex |
| --- | --- |
| Arco de avance, dentro del límite | `#1f9d55` |
| Arco pasado de límite, pill de suba mala | `#e5484d` |
| Pista gris del medidor | `#e6e8ee` |
| Barra de gasto diario | `#16a34a` → `#4ade80` |
| Bloques de presupuesto | `#f97316` lleno, `#f1f2f4` vacío |

El color de un monto puede ser verde o rojo. El círculo del ícono no.

### Paleta de categorías

Punto chico, nunca el relleno del ícono. Definida en `DOT` de `src/components/viz/day-cylinders.tsx`:

| Categoría | Color |
| --- | --- |
| housing | `#7c6cf0` |
| food | `#d08a1f` |
| transport | `#d97706` |
| entertainment | `#db2777` |
| health | `#1f9d55` |
| education | `#3b82f6` |
| subscriptions | `#ea580c` |
| clothing | `#db2777` |
| savings | `#1f9d55` |
| other | `#6d7480` |

Dona (`DONUT_COLORS` en `src/lib/chart-series.ts`): `#F5A04C`, `#3CB87A`, `#F2C14E`. El resto va con trama `#F3EEE4`.

Tira (`STRIP_COLORS`): `#8B7CF6`, `#6B93F5`, `#F0A05A`, `#3DCA86`, `#67B7F0`, `#F0734A`.

Comercios, solo el punto de la fila: `#3b82f6`, `#f97316`, `#8b5cf6`, `#14b8a6`.

### Radios

| Token | Valor |
| --- | --- |
| `--radius` | `1rem` |
| `--radius-sm` … `--radius-4xl` | `0.6` a `2.6` veces `--radius` |
| `.viz-card` | `26px`; desde `sm`, `28px` |
| Chips, `···`, segmentos | `rounded-full` |
| Filas internas | `rounded-2xl` |

### Espaciado

| Lugar | Valor |
| --- | --- |
| Página | `px-4 py-4`, desde `sm` `px-6 py-6` |
| Grilla | `gap-4` |
| `.viz-card` | `18px 16px 16px`; desde `sm`, `22px 22px 18px` |
| `.page-head` | `14px 16px`; desde `sm`, `16px 28px` |
| Entre título y cuerpo de tarjeta | `mb-4` en el header de `ChartCard` |

No inventes una escala nueva. Usá 4, 8, 12, 16, 22.

### Sombras

Tarjeta:

```css
box-shadow:
  0 1px 2px rgba(15, 23, 42, 0.04),
  0 18px 40px rgba(15, 23, 42, 0.045);
```

Popover y menú: `0 12px 32px rgba(15, 23, 42, 0.12)` más `ring-1 ring-black/[0.06]`.

El modo `.dark` existe en `globals.css`. La app no lo activa. No diseñes pantallas oscuras salvo que el cambio lo pida.

## 3. Tipografía

Geist entra por el paquete `geist`, no por `next/font/google`.

```tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
```

`src/app/layout.tsx` pone `GeistSans.variable` y `GeistMono.variable` en `<html>`. Las variables CSS son `--font-geist-sans` y `--font-geist-mono`. `--font-sans` apunta a la sans. El cuerpo usa `font-weight: 400`.

No uses `next/font/google` para estas fuentes. Next 16.2.9 rompe el build de Vercel cuando Google responde URLs con `&`.

### Escala

| Rol | Clase actual | Notas |
| --- | --- | --- |
| Monto hero | `num text-[clamp(2rem,7vw,2.6rem)]` | `.num` es 700, tracking `-0.045em`, tabular-nums |
| Monto de tarjeta | `HeroNumber`: `num text-[clamp(1.7rem,6.4vw,2.55rem)] text-[#16181d]` | Un hero por tarjeta |
| Título de página | `text-[1.35rem] font-semibold tracking-[-0.03em]` | |
| Título de tarjeta | `text-[17px] font-semibold tracking-[-0.03em] text-[#1c1f26]` | |
| Etiqueta | `text-[13px] text-[#9aa1ab]` | Sin mayúsculas, sin tracking ancho |
| Cuerpo | `text-[14px] leading-snug text-[#6d7480]` | |
| Caption | `text-[12px]` o `text-[11px] text-[#b0b6bf]` | |
| Stat | `text-[clamp(0.82rem,3.2vw,1rem)] font-semibold tabular-nums` | |

`HeroNumber` está en `src/components/viz/ui.tsx`.

### Prohibido en UI nueva

- `font-mono` para etiquetas, fechas o montos de tarjeta. Los pesos van con `formatPesos`, `formatChartPesos` o `formatMoney`.
- `uppercase tracking-wider` en micro-etiquetas.
- Más de un tamaño hero en la misma tarjeta.

Queda `font-mono` en pantallas viejas (formularios, tarjetas de crédito). No lo copies. Si tocás esa pantalla, pasala a sans.

### Números

Siempre es-AR.

| Helper | Archivo | Cuándo |
| --- | --- | --- |
| `formatPesos` | `src/lib/money.ts` | Montos de la app. Enteros sin decimales; si hay centavos, dos. Signo `−`. |
| `formatMoney` | `src/lib/money.ts` | Cuando la moneda puede ser USD (`US$`) |
| `formatChartPesos` | `src/lib/chart-format.ts` | El mismo criterio, para gráficos |
| `formatAxisPesos` | `src/lib/chart-format.ts` | Ejes: `$30 mil`, `$1,2 M` |
| `formatSignedPercent` | `src/lib/chart-format.ts` | `+1,5%` / `−0,4%` |

No uses `toLocaleString("en-US")` ni `$1,234.56`.

Fechas con `formatIso` (`src/lib/format-date.ts`) y `date-fns/locale/es`. No pongas `capitalize` de Tailwind sobre una fecha: convierte "de" en "De".

## 4. Layout

### Anatomía de tarjeta

Usá `ChartCard` (`src/components/viz/ui.tsx`) o la clase `.viz-card`.

1. Título a 17px.
2. Subtítulo opcional, 13px, `#9aa1ab`.
3. Acción a la derecha: `DotLink` (un `···` redondo) o un `Segmented`. El `···` de Saldo real abre el menú de ajustar y corregir; no lo dejes como adorno.
4. Cuerpo. Si la tarjeta está en una grilla, el cuerpo es `flex-1`.

`ChartCard` ya es `flex h-full min-h-0 flex-col`. El children va en un contenedor `flex-1`.

### Escritorio

Contenedor de Inicio e Higiene:

```txt
mx-auto grid w-full min-w-0 max-w-6xl grid-cols-1 items-stretch gap-4
px-4 py-4 sm:px-6 sm:py-6 xl:grid-cols-2
```

- Dos columnas desde `xl` (1280px).
- `items-stretch`. Las dos tarjetas de la fila tienen el mismo alto.
- Una fila de ancho completo lleva `xl:col-span-2` (saldo, bloques de presupuesto, últimos movimientos, tira de categorías).
- El gráfico vive en `chartPlotFrameClass` (`relative min-h-[210px] w-full flex-1`) y el SVG en `chartPlotSvgClass` (`absolute inset-0 h-full w-full`). `useChartPlot` recalcula el alto del viewBox para que el dibujo llene la tarjeta sin deformarse y sin dejar un blanco abajo.
- No uses `h-auto w-full` en un SVG de serie: en una columna ancha el alto se dispara.
- Sidebar desde `md`: `w-56`, contenido `md:ml-56`.

Pares que ya tienen que quedar parejos:

| Pantalla | Fila |
| --- | --- |
| Inicio | Flujo de caja / Gasto diario |
| Inicio | Gastos / Del sueldo |
| Inicio | Día por día / Comercios |
| Higiene | Saldo / Este período y el anterior |
| Higiene | Para mirar / Se repiten |

### Móvil

- Anchos que no pueden desbordar: 360 y 390.
- `html, body` tienen `overflow-x: clip` y `max-width: 100%`. Eso no autoriza a recortar contenido: el contenido tiene que entrar.
- `min-w-0` en grillas, flex y textos largos. `truncate` en el nombre, no en el monto si podés bajar el tamaño.
- Viewport: `viewportFit: "cover"` en `src/app/layout.tsx`.
- Barra inferior, solo `< md`. El contenido reserva `pb-[calc(4.6rem+env(safe-area-inset-bottom))]`. La barra también usa `env(safe-area-inset-bottom)` y los inset izquierdo y derecho.
- Cinco ítems: Inicio, Movimientos, Sueldo, Higiene, Más. El resto sale en la hoja de Más.
- Ítem activo: texto `#16181d` sobre superficie gris. Inactivo: `#8b919c`. Sin ícono azul sobre fondo azul.

## 5. Íconos

Clase obligatoria, `iconWell` en `src/components/viz/ui.tsx`:

```txt
flex size-9 shrink-0 items-center justify-center rounded-full
border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]
```

El ícono es `#1c1f26`. El fondo es gris. Nunca verdes sobre verde, nunca violeta sobre violeta, nunca rojo sobre rojo.

El color de categoría es un punto de 6px (`size-1.5`) al lado del texto, con `DOT`.

Permitido:

- Monto en `text-income` o `text-expense`.
- Botón sólido de marca o de confirmación, con ícono claro sobre fondo oscuro.
- Punto, arco o barra de un gráfico.

Prohibido:

- `bg-income/10 text-income` (o expense, o un hex del mismo matiz) en el círculo del ícono.
- Nav activo con ícono de color sobre pastilla del mismo color.

## 6. Gráficos

Un solo sistema: SVG en `src/components/viz`. No agregues Recharts, visx ni otra librería. Los datos salen de `src/lib/chart-series.ts` y de `useMoneySnapshot`. No reescribas la lógica de plata.

### Inventario

| Componente | Archivo | Props | Cuándo |
| --- | --- | --- | --- |
| `MonthlyBarsCard` | `src/components/viz/monthly-bars.tsx` | `points: MonthFlowPoint[]` | Ingresos vs gastos por mes. `monthlyFlow`. |
| `DailyBarsCard` | `src/components/viz/daily-bars.tsx` | `days: AlignedDay[]`, `periodLabel` | Gasto diario del período contra el anterior. `alignedSpendDays`. |
| `ExpenseDonutCard` | `src/components/viz/expense-donut.tsx` | `total`, `previous`, `slices: DonutSlice[]`, `window`, `onWindow` | Reparto de gastos. `expenseDonut`. |
| `BudgetGaugeCard` | `src/components/viz/budget-gauge.tsx` | `spent`, `expected`, `left`, `pct`, `periodLabel` | Porcentaje del sueldo esperado. `allowance`. |
| `BudgetBlocksCard` | `src/components/viz/budget-blocks.tsx` | `spent`, `expected`, `left`, `daysLeft`, `perDay` | "Te quedan $X para N días". |
| `DayCylindersCard` | `src/components/viz/day-cylinders.tsx` | `days`, `movements: CylinderMovement[]`, `periodLabel` | Tocá un día y ves sus movimientos. |
| `MerchantCard` | `src/components/viz/merchant-card.tsx` | `model: MerchantCardModel` | Comercios con campo `merchant`. `merchantCard`. |
| `BalanceLineCard` | `src/components/viz/balance-line.tsx` | `points: BalancePoint[]` | Saldo al cierre de cada mes. `balanceSeries`. |
| `FlowAreaCard` | `src/components/viz/flow-area.tsx` | `points: AreaPoint[]`, `currentLabel`, `delta` | Este período contra el anterior. `periodArea`. |
| `CategoryStripCard` | `src/components/viz/category-strip.tsx` | `income`, `expense`, `incomeCount`, `expenseCount`, `segments` | Tira del mes. `categoryStrip`. |

Piezas compartidas en `src/components/viz/ui.tsx`: `ChartCard`, `DotLink`, `Segmented`, `HoverTip`, `TipAnchor`, `EmptyChart`, `HeroNumber`, `DeltaPill`, `useChartPlot`.

Geometría en `src/components/viz/geometry.ts`: `topRoundedBar`, `smoothLine`, `smoothArea`, `yAt`, `clampPercent`.

### Reglas

Dona (`layoutDonut` en `expense-donut.tsx`):

- Arcos con `stroke-dasharray` sobre un círculo. Arranque a las 12 (`rotate(-90)`).
- `strokeLinecap="round"`. Cada cap sobresale medio grosor. El tramo sin pintar es `stroke + clearGap` (hoy grosor 18 y hueco visible 9). Si no, los caps se pisan.
- Proporción real del valor. Un mínimo (`minDash`, tope 7) para que la categoría chica se vea, sin pasarse del perímetro.
- Un solo trazo por segmento. No superpongas otro arco decorativo.

Medidor (`budget-gauge.tsx`):

- Un solo path semicircular. Pista `#e6e8ee` y avance `#1f9d55` (rojo `#e5484d` si el porcentaje pasa de 100).
- Mismo `strokeWidth` (18) y mismo `strokeLinecap="round"`.
- El avance es `strokeDasharray` de la longitud `π * radio`, recortado al porcentaje.
- El monto y el porcentaje van debajo del arco, no encima.
- No vuelvas a las marcas rotadas. Se pixelan y se montan.

Barras:

- Mes inactivo en gris. El mes elegido lleva el acento (cian ingresos, magenta gastos) y el tooltip.
- El diario: barra verde adelante, gris del período anterior atrás.
- Eje con `formatAxisPesos`.

Tooltip:

- `HoverTip` dentro de `TipAnchor`.
- En móvil se abre con toque (`onClick` en la columna), no solo con hover.
- Tiene que quedar dentro de la tarjeta. `clampPercent` evita que se salga por los costados.
- Un dato por fila: barra de color, monto, etiqueta corta.

Precisión:

- El viewBox y el alto medido por `useChartPlot` tienen la misma relación de aspecto. `preserveAspectRatio="none"` no deforma porque el aspecto coincide.
- No agregues un segundo dibujo del mismo punto (marca llena más marca vacía).

## 7. Texto

Español rioplatense, voseo: "cobrás", "tenés", "configurá". No uses "tú" ni "vosotros".

Corto. Una idea por línea.

- Bien: "Te quedan $1.147.192 del sueldo · cobrás en 6 días".
- Mal: un párrafo que explique la base, el sueldo esperado y los ajustes en la cara de la tarjeta.

La explicación va en el ícono de info (toque y hover), como en Saldo real. El menú `···` es para acciones, no para texto de ayuda.

No repitas un número que ya está en la misma pantalla. El porcentaje del sueldo vive en Del sueldo, no en el saldo.

## 8. Inventario de componentes

Antes de crear un componente, buscá si este ya hace el trabajo.

| Archivo | Para qué |
| --- | --- |
| `src/components/viz/ui.tsx` | Tarjeta, tooltip, número, ícono neutro, plot que se estira |
| `src/components/viz/*` | Gráficos de la sección 6 |
| `src/components/real-balance-panel.tsx` | Tarjeta de saldo en Inicio. Incluye los diálogos de ajustar y corregir |
| `src/components/money-agreement.tsx` | Los tres números iguales en Movimientos e Higiene. No lo dupliques dentro del saldo |
| `src/components/sidebar.tsx` | Nav de escritorio y barra inferior |
| `src/components/transaction-list.tsx` | Lista de movimientos, agrupada por día |
| `src/components/transaction-form.tsx` | Alta de movimiento |
| `src/components/salary-setup.tsx` | Alta y edición del sueldo |
| `src/components/salary-countdown.tsx` | Cobro que viene y registro de que cobró |
| `src/components/salary-history.tsx` | Cobros anteriores |
| `src/components/salary-review.tsx` | Sueldos para revisar |
| `src/components/goal-card.tsx` / `goal-form.tsx` | Una meta y su formulario |
| `src/components/subscription-form.tsx` | Alta de suscripción |
| `src/components/card-form.tsx` / `installment-form.tsx` | Tarjeta y cuotas |
| `src/components/credit-card-visual.tsx` | La tarjeta dibujada |
| `src/components/login-form.tsx` | Entrar y crear cuenta |
| `src/components/status-banners.tsx` | Error de sync e importación |
| `src/components/shape-provider.tsx` | Sesión. Con `NEXT_PUBLIC_SHAPE_PREVIEW=1` carga datos locales |
| `src/components/user-guard.tsx` | Manda a login si no hay sesión |
| `src/components/ui/*` | Primitivas (botón, diálogo, input, tooltip). No las reescribas |

`balance-card.tsx`, `metric-card.tsx`, `goals-mini.tsx` y `recent-transactions.tsx` no están en las pantallas actuales. No los uses como modelo.

Pantallas: `src/app/(main)/page.tsx` (Inicio), `transactions`, `salary`, `health` (Higiene), `cards`, `subscriptions`, `goals`, `profile`, y `src/app/login/page.tsx`.

## 9. Checklist antes de abrir un PR

- [ ] Leíste este archivo y el cambio respeta los tokens, la tipografía y los íconos.
- [ ] No copiaste código de Mebius ni agregaste Recharts o visx.
- [ ] No hay `font-mono` ni etiquetas en mayúsculas en lo que tocaste.
- [ ] El ícono no es del mismo tono que su fondo. El color de categoría es un punto.
- [ ] En `xl`, las tarjetas de una fila tienen el mismo alto y el gráfico llena el espacio.
- [ ] A 360 y a 390 no hay scroll horizontal.
- [ ] La barra inferior no tapa contenido y respeta el safe area.
- [ ] Los números nuevos pasan por los helpers es-AR.
- [ ] No repetiste un dato que ya muestra otra tarjeta de esa pantalla.
- [ ] `npm run build` pasa.
- [ ] Hay captura a 1440 y a 390 de lo que cambió.
