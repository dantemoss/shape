# Sistema visual

Reglas para cualquiera que toque la UI. Si este archivo y el código discrepan, el código manda y hay que actualizar el documento en el mismo cambio.

Para reutilizarlo en otro proyecto: cambiá **Parámetros** y la sección **Shape**. El resto (principios, tokens, tipografía, layout, íconos, gráficos, texto, herramientas, movimiento y checklist) se queda.

## Parámetros

| Parámetro | Esta instancia |
| --- | --- |
| Producto | Shape, finanzas personales |
| Voz | Español rioplatense, voseo |
| Locale de números y fechas | `es-AR` |
| Moneda principal | ARS. USD se muestra aparte |
| Fuente | Geist, paquete `geist`. Sans en la UI |
| Marca | `#2F48A1` (`--brand`) |
| Radio base | `--radius: 1rem`. Tarjeta: 26px, 28px desde `sm` |
| Densidad | Cómoda. Escala 4, 8, 12, 16, 22. Grilla `gap-4`. No apretar ni dejar huecos muertos |
| Ingreso / gasto | Verde de ingreso, rojo de gasto. Solo en el monto, el arco o la barra |

### Valores de Shape

Están en `src/app/globals.css`. Tailwind v4 los expone con `@theme inline` (`bg-background`, `text-income`, `border-border`).

Superficies:

| Token | Valor en `:root` | Uso |
| --- | --- | --- |
| `--background` | `oklch(0.972 0.003 260)` | Fondo de la app |
| `--card` / `--popover` | `oklch(1 0 0)` | Tarjetas y popovers |
| `--secondary` / `--muted` / `--accent` | `oklch(0.965 0.003 260)` | Fondos suaves |
| `--sidebar` | `oklch(0.97 0 0)` | Sidebar |

Literales de superficie que ya usa la UI:

| Uso | Valor |
| --- | --- |
| Tarjeta (`.viz-card`) | `#fff` |
| Pozo de ícono | `#f4f5f7` |
| Botón `···` y chips | `#f5f6f8` / `#f4f5f7` |
| Fila de leyenda | `#f6f7f9` |
| Activo del nav | `#f3f4f6` |

Texto:

| Token | Valor | Uso |
| --- | --- | --- |
| `--foreground` | `oklch(0.22 0.02 265)` | Texto principal del tema |
| `--muted-foreground` | `oklch(0.58 0.012 260)` | Texto secundario del tema |

| Rol | Color |
| --- | --- |
| Título y número hero | `#16181d` / `#1c1f26` |
| Cuerpo | `#3a4150` / `#6d7480` |
| Etiqueta | `#9aa1ab` |
| Caption | `#8b919c` / `#b0b6bf` |

Bordes: `--border` y `--input` son `oklch(0.92 0.004 260)`. `--ring` es `oklch(0.72 0.02 260)`. El borde de ícono y de tarjeta es `border-black/[0.06]` o `ring-1 ring-black/[0.04]`. Sin borde de color.

Acento, ingresos y gastos:

| Token | Valor | Uso |
| --- | --- | --- |
| `--brand` | `#2F48A1` | Botón primario (`bg-brand`) |
| `--brand-foreground` | `#ffffff` | Texto sobre el botón |
| `--income` | `oklch(0.55 0.15 162)` | Montos que entran |
| `--income-foreground` | `oklch(0.97 0.02 162)` | Texto sobre fondo income |
| `--expense` / `--destructive` | `oklch(0.577 0.245 27.325)` | Montos que salen y acciones destructivas |
| `--expense-foreground` | `oklch(0.97 0.02 27)` | Texto sobre fondo expense |

Verdes y rojos de gráficos. No los pongas en el pozo del ícono:

| Uso | Hex |
| --- | --- |
| Arco de avance, dentro del límite | `#1f9d55` |
| Arco pasado de límite | `#e5484d` |
| Pista gris del medidor | `#e6e8ee` |
| Barra de gasto diario | `#16a34a` → `#4ade80` |
| Bloques de presupuesto | `#f97316` lleno, `#f1f2f4` vacío |

Radios: `--radius` es `1rem`. `--radius-sm` a `--radius-4xl` van de `0.6` a `2.6` veces `--radius` (`0.6`, `0.8`, `1`, `1.4`, `1.8`, `2.2`, `2.6`). Chips, `···` y segmentos son `rounded-full`. Filas internas, `rounded-2xl`.

Espaciado: página `px-4 py-4` y desde `sm` `px-6 py-6`. Grilla `gap-4`. Tarjeta `18px 16px 16px`, desde `sm` `22px 22px 18px`. Cabecera de página `14px 16px`, desde `sm` `16px 28px`. Entre título y cuerpo de tarjeta, `mb-4`.

Sombra de tarjeta:

```css
box-shadow:
  0 1px 2px rgba(15, 23, 42, 0.04),
  0 18px 40px rgba(15, 23, 42, 0.045);
```

El panel Tu dinero de Higiene no usa esa sombra. Fondo `#fff`, filete de 1px (`border-border`) y el radio de tarjeta (26px, 28px desde `sm`). El grano es un filtro SVG estático, alpha `0.08`, solo dentro del panel. No oscurece el blanco. Detrás del saldo baja a 0.45 de esa alpha.

Popover y menú: `0 12px 32px rgba(15, 23, 42, 0.12)` más `ring-1 ring-black/[0.06]`.

El modo `.dark` existe y no está activo. No diseñes pantallas oscuras salvo que el cambio lo pida. La excepción es la ficha de Mi perfil en escritorio: tinta sobre el fondo claro de la app, con una banda índigo.

## 1. Principios

Calmo, preciso, con aire. Tarjetas claras, números grandes, un solo acento por gráfico, mucho gris.

No hagas "AI slop":

- La cabecera y la barra inferior no son vidrio: superficie sólida y filete, sin `backdrop-filter`.
- No pongas un ícono del mismo tono que su contenedor.
- No uses fondos shader, partículas, WebGL, canvas ni gradientes de demostración.
- No uses tipografía mono en la interfaz.
- No dejes etiquetas en mayúsculas chiquitas (`text-[10px] uppercase tracking-wider`).
- No estires un gráfico al ancho de la ventana.
- No repitas el mismo número en dos lugares de la misma pantalla.
- Una idea por línea. La explicación larga va detrás de un ícono de info.
- No copies código de una referencia con licencia que prohíba publicarlo. La referencia es visual. El código es original.

## 2. Tokens

Nombrá roles (`--background`, `--brand`, `--income`), no hex sueltos en cada componente. Los valores de esta instancia están en Parámetros. No inventes una escala de espacio ni de radio nueva.

El color de un monto puede ser el de ingreso o el de gasto. El círculo del ícono no.

## 3. Tipografía

La sans del parámetro entra por paquete local, no por `next/font/google`. En Shape:

```tsx
import { GeistSans } from "geist/font/sans";
import { GeistMono } from "geist/font/mono";
```

`src/app/layout.tsx` pone las variables en `<html>`. `--font-sans` apunta a la sans. El cuerpo usa `font-weight: 400`. Next 16.2.9 rompe el build de Vercel si Google responde URLs con `&`.

| Rol | Clase (`moneyClass` en `Amount`) | Notas |
| --- | --- | --- |
| Monto hero | `clamp(2.25rem, 5.2vw, 3rem)` · 36–48px | Un solo protagonista por tarjeta. Semibold, tracking `-0.045em` |
| Stat primario | `clamp(1.375rem, 2vw, 1.75rem)` · 22–28px | Entró, salió, saldo de una fila, totales de tarjeta. Tracking `-0.03em` |
| Monto de lista | `1rem` / `1.0625rem` desde `sm` · 16–17px | Filas. `size="secondary"` |
| Etiqueta | `text-[13px]`, color de etiqueta, arriba del monto, `mt-1.5` | Sin mayúsculas, sin tracking ancho |
| Título de página | `text-[1.35rem] font-semibold tracking-[-0.03em]` | |
| Título de tarjeta | `text-[17px] font-semibold tracking-[-0.03em]` | |
| Cuerpo | `text-[14px] leading-snug` | |
| Caption | `text-[12px]` o `text-[13px]` | |

El monto no se parte ni se trunca. `whitespace-nowrap` y cifras tabulares. En 360 y 390, `StatRow` de tres queda en dos columnas: los dos primeros lado a lado y el tercero en la fila de abajo, a la izquierda. Solo pasa a una columna si, al medir, el monto no entra en la celda.

El signo y los decimales van al 62% del entero, más livianos (`opacity-80`), en la misma línea de base. Si los centavos son cero, no se muestran. El entero queda en es-AR (`12.072.199`). Ingreso en `text-income`. El resto, incluido lo que se debe y todavía no venció, va en `#1c1f26`. `text-expense` queda para un vencimiento ya pasado o un saldo por encima del límite. Un resumen, una cuota, una suscripción o un total no se pintan de rojo solo porque son una salida.

Prohibido en UI nueva: `font-mono` para etiquetas, fechas o montos, y `uppercase tracking-wider` en micro-etiquetas. Los montos pasan por el helper del parámetro de locale.

En Shape: `formatPesos` y `formatMoney` en `src/lib/money.ts`, `formatChartPesos`, `formatAxisPesos` y `formatSignedPercent` en `src/lib/chart-format.ts`. Fechas con `formatIso` (`src/lib/format-date.ts`). No pongas `capitalize` de Tailwind sobre una fecha: convierte "de" en "De".

## 4. Layout

Anatomía de tarjeta:

1. Título.
2. Subtítulo opcional, una línea.
3. Acción a la derecha: menú `···` o control segmentado. El `···` abre acciones. No es adorno.
4. Cuerpo. En una grilla, el cuerpo es `flex-1` y la tarjeta es `h-full`.

Escritorio:

- Contenedor `max-w-6xl`, dos columnas desde `xl` (1280px), `items-stretch`, `gap-4`.
- Las dos tarjetas de una fila tienen el mismo alto. El gráfico crece y llena la tarjeta. No dejes un blanco abajo.
- Una fila de ancho completo lleva `xl:col-span-2`.
- El gráfico mide su caja y el viewBox usa la misma relación de aspecto. No uses `h-auto w-full` en un SVG de serie.
- Sidebar desde `md`.

Móvil:

- 360 y 390 no desbordan. `overflow-x: clip` no autoriza a recortar contenido.
- `min-w-0` en grillas y textos largos.
- `viewportFit: "cover"`. La barra inferior reserva `env(safe-area-inset-bottom)` y no tapa el contenido.
- El ítem activo es texto oscuro sobre superficie gris.

Cromo fijo:

- `.page-head` usa `background: var(--background)` y un filete inferior `var(--border)`.
- La barra de abajo, solo en `< md`, es `bg-card` con filete `border-border` arriba.
- Ninguna de las dos lleva `backdrop-filter`. Lo que scrollea no se ve a través.

## 5. Íconos

Pozo neutro, borde sutil, ícono oscuro:

```txt
flex shrink-0 items-center justify-center rounded-full
border border-black/[0.06] bg-[#f4f5f7] text-[#1c1f26]
```

El ícono nunca es del mismo tono que su contenedor. El color de categoría es un punto de 6px (`size-1.5`) al lado del texto.

Permitido: monto en color de ingreso o gasto, botón sólido de marca o de confirmación con ícono claro, punto o arco o barra de un gráfico.

Prohibido: `bg-income/10 text-income` (o el equivalente de gasto, o un hex del mismo matiz) en el círculo. Nav activo con ícono de color sobre pastilla del mismo color.

## 6. Gráficos

Los gráficos de serie salen de Recharts, adentro de la primitiva `chart` de shadcn (`src/components/ui/chart.tsx`, MIT). Los ejemplos de partida son los de ReUI (MIT): barras agrupadas, barras punteadas, barras monocromas que se ensanchan, área con degradado, dona con total al centro y radial de una sola barra. No copies la tarjeta de demostración: sin badge, sin glow, sin trama, sin 3D y sin `max-w-md` ni `aspect-video`. El alto es fijo (`min-h-[220px]`, la dona y el radial en 220 y 200) para que las tarjetas de una fila coincidan.

Los colores son `--chart-1` a `--chart-5`: ingreso, gasto, marca `#2F48A1`, ámbar `#F5A04C` y oro `#F2C14E`. Nada de violeta. El monto del tooltip y del centro pasa por `Amount`. El tooltip es la ficha blanca de `HoverTip` (barra, monto, pista) y no se sale de la tarjeta. En el teléfono se abre con toque.

La animación de Recharts dura 240 ms, ease-out. `isAnimationActive` queda en `auto`, así que con `prefers-reduced-motion` no se mueve. La barra del día ensancha en 220 ms con una transición CSS, y quieta si el sistema pide menos movimiento. El anillo de Tu dinero y su barra partida crecen en 250 ms, ease-out, y también quedan quietos si el sistema pide menos movimiento.

Bloques de presupuesto y la tira de categorías siguen en SVG propio: ReUI no tiene un equivalente. La tira no es un gráfico de serie: va en su propia fila, a ancho completo, y la tarjeta mide el contenido (`h-auto`). No comparte celda con una fila más alta, porque eso dejaba un blanco adentro. Para mirar y Se repiten siguen igualadas entre sí.

No reescribas la lógica de los números para dibujarlos. Sigue en `src/lib/chart-series.ts`.

## 7. Texto

La voz sale del parámetro. En Shape: rioplatense, voseo ("cobrás", "tenés", "configurá"). Sin "tú" ni "vosotros".

Corto. Una idea por línea. La explicación va en el ícono de info (toque y hover). El menú `···` es para acciones, no para ayuda.

No repitas un número que ya está en la misma pantalla.

## 8. Herramientas y cuándo usarlas

No uses todas las librerías a la vez. Elegí por contexto. Evitá un diseño pesado de ver o de usar.

| Herramienta | Cuándo |
| --- | --- |
| [shadcn/ui](https://ui.shadcn.com/docs/components) | Base de todas las primitivas. Ya está instalado. Botón, diálogo, input, tooltip, chart y el resto salen de `src/components/ui`. No los reescribas y no los reemplaces por otro kit. |
| [Recharts](https://recharts.org/) + [ReUI Chart](https://reui.io/components/chart) | Solo los gráficos de `src/components/viz` que tienen equivalente en ReUI (MIT). Recharts entra por la primitiva `chart`. No sumes otra librería de charts. |
| [Aceternity UI](https://ui.aceternity.com/) y [React Bits](https://reactbits.dev/) | Un componente copiado, solo cuando un momento puntual lo necesita. Sin fondos animados, WebGL, canvas, partículas ni shaders pesados. Antes de copiar, mirá la licencia y lo que suma al bundle. |
| [bencho.dev](https://bencho.dev/) | Referencia visual y de componentes. Mirá la licencia antes de copiar código. |
| [PrimeReact](https://primereact.dev/components) | No convive con shadcn por defecto: es otro sistema y pesa más. Solo un widget complejo (tabla de datos, calendario de rango) que shadcn no cubra, tematizado con estos tokens e importado por componente. |
| [NumberFlow](https://number-flow.barvian.me/) | El número que cambia: saldo hero y totales. Es liviano. Preferilo para esos números. No lo pongas en cada fila de una lista. |
| [GSAP](https://gsap.com/) | Solo una secuencia que CSS no puede hacer. `import()` dinámico, fuera del bundle inicial. El microinteracción por defecto es una transición CSS. |
| [React Email](https://react.email/) | Solo correos (por ejemplo un resumen semanal). Nunca entra al bundle de la app. |

Performance: import por componente, `import()` dinámico para lo pesado, y ninguna dependencia nueva sin un motivo en la descripción del PR. Si agregás una, mirá el peso en la salida de `next build`.

## 9. Movimiento

Sutil y nunca forzado.

- Duración corta, entre 150 y 300 ms. Ease-out.
- Sin bounce ni spring que se pase del destino.
- Respetá `prefers-reduced-motion`. NumberFlow lleva `respectMotionPreference`.
- Una aparición o un cambio de número. No una escena.
- La cara de una tarjeta es vidrio satinado: azul para Visa, grafito para Mastercard, acero para Amex. Una banda diagonal de luz, solo con `transform`, se corre con el puntero en 220 ms. Con `prefers-reduced-motion` queda quieta.

## 10. Checklist antes de abrir un PR

- [ ] Leíste este archivo. El cambio respeta parámetros, tokens, tipografía e íconos.
- [ ] No copiaste código de una referencia con licencia incompatible. Recharts y la primitiva `chart` son las únicas librerías de gráficos.
- [ ] No hay `font-mono` ni etiquetas en mayúsculas en lo que tocaste.
- [ ] El ícono no es del mismo tono que su fondo. El color de categoría es un punto.
- [ ] En el breakpoint ancho, las tarjetas de una fila tienen el mismo alto y el gráfico llena el espacio.
- [ ] A 360 y a 390 no hay scroll horizontal. La barra inferior no tapa contenido.
- [ ] Los números nuevos pasan por el helper del locale.
- [ ] No repetiste un dato que ya muestra otra tarjeta de esa pantalla.
- [ ] La animación, si hay, dura 150–300 ms, ease-out, y respeta `prefers-reduced-motion`.
- [ ] No sumaste una dependencia sin decir por qué. Si la sumaste, miraste el bundle.
- [ ] `npm run build` pasa.
- [ ] Hay captura a 1440 y a 390 de lo que cambió.

## Shape

Inventario de este repo. En otro proyecto esta sección se reemplaza.

No copies archivos, componentes ni el registro de Mebius. La licencia de Mebius no permite publicarlos, y este repositorio es público.

### Primitivas

Están en `src/components/primitives.tsx`. shadcn sigue siendo la base de botón, diálogo, input y tooltip. Estas primitivas arman la anatomía de Shape encima. Reutilizalas antes de crear otra.

| Primitiva | Para qué |
| --- | --- |
| `PageHeader` | Título de página, subtítulo y acción. Va con `pageStackClass`. |
| `Card` | Título, subtítulo, acción, cuerpo `flex-1`. |
| `CardMenu` | Botón `···` con ítems (`href` o `onSelect`). |
| `Stat` / `StatRow` | Etiqueta de 13px arriba del valor, montos en la misma línea de base. En 360/390 una fila de tres usa dos columnas. `sm` y `md` son el stat primario; `lg`, el hero. |
| `Amount` | Monto es-AR. `size`: `hero`, `primary` (default), `secondary`. Signo y centavos más chicos. `tone`: `income`, `expense`, `neutral`, `auto`. `signed` pone `+` o `−`. `animate` mueve solo el entero. |
| `IconWell` | Pozo neutro. `size`: `sm`, `md`, `lg`. La clase suelta sigue en `iconWell` (`src/components/viz/ui.tsx`). |
| `CategoryDot` | Punto de 6px. |
| `Chip` | Pastilla gris (`Sueldo cobrado`, `US$42 aparte`). |
| `SegmentedControl` | Segmentos. `viz/ui` lo reexporta como `Segmented`. |
| `InfoTip` | Ícono de info. Hover con mouse y toque. |
| `ListRow` | Pozo, título, meta, monto y acciones. |
| `EmptyState` | Vacío corto, sin emoji ni borde punteado. |

`ChartCard` arma un `Card` y, si no hay `action`, pone `DotLink`. No le cambies la firma: `title`, `subtitle`, `href`, `action`, `children`, `className`.

### Gráficos de Shape

En `src/components/viz`. Los de serie usan Recharts. Los datos salen de `src/lib/chart-series.ts` y de `useMoneySnapshot`.

| Componente | Archivo | Props | Cuándo |
| --- | --- | --- | --- |
| `MonthlyBarsCard` | `src/components/viz/monthly-bars.tsx` | `points: MonthFlowPoint[]` | Ingresos vs gastos por mes. `monthlyFlow`. |
| `DailyBarsCard` | `src/components/viz/daily-bars.tsx` | `days: AlignedDay[]`, `periodLabel` | Gasto diario del período contra el anterior. `alignedSpendDays`. |
| `ExpenseDonutCard` | `src/components/viz/expense-donut.tsx` | `total`, `previous`, `slices`, `window`, `onWindow` | Reparto de gastos. `expenseDonut`. |
| `BudgetGaugeCard` | `src/components/viz/budget-gauge.tsx` | `spent`, `expected`, `left`, `pct`, `periodLabel` | Porcentaje del sueldo esperado. `allowance`. |
| `BudgetBlocksCard` | `src/components/viz/budget-blocks.tsx` | `spent`, `expected`, `left`, `daysLeft`, `perDay` | "Te quedan $X para N días". |
| `DayCylindersCard` | `src/components/viz/day-cylinders.tsx` | `days`, `movements`, `periodLabel` | Tocá un día y ves sus movimientos. |
| `MerchantCard` | `src/components/viz/merchant-card.tsx` | `model: MerchantCardModel` | Comercios. `merchantCard`. |
| `BalanceLineCard` | `src/components/viz/balance-line.tsx` | `points: BalancePoint[]` | Saldo al cierre de cada mes. `balanceSeries`. |
| `FlowAreaCard` | `src/components/viz/flow-area.tsx` | `points`, `currentLabel`, `delta` | Este período contra el anterior. `periodArea`. |
| `CategoryStripCard` | `src/components/viz/category-strip.tsx` | `income`, `expense`, `incomeCount`, `expenseCount`, `segments`, `className?` | Tira del mes. `categoryStrip`. Alto del contenido, no del vecino. |

En `src/components/viz/ui.tsx`: `ChartCard`, `DotLink`, `Segmented`, `HoverTip`, `EmptyChart`, `iconWell`. El tooltip de Recharts está en `shape-tooltip.tsx` y se ve como `HoverTip`.

La dona es un `Pie` con hueco, total en el centro con `Amount` y los colores de `DONUT_COLORS`. El resto es el neutro `#F3EEE4`, sin trama. El medidor es un `RadialBar` de una sola barra, pista `#e6e8ee`, verde dentro del límite y rojo si pasa de 100. El monto y el porcentaje van debajo.

El anillo de Tu dinero es el mismo `RadialBar` de una barra (ReUI c-chart-25), tinta `#171717`, pista `oklch(0.94 0.004 260)`, 250 ms. El número va al centro. «Buena» y «Excelente» van en `text-income`. «Regular» queda `#d97706` y «Crítica», `#e5484d`. La barra no cambia de color.

### Higiene · Tu dinero

Reemplaza el acuerdo de tres montos y las cuatro tarjetas (Salud, Gastos del mes, Del sueldo, Recurrentes). El gasto del mes queda una sola vez, en la barra. Por categoría, Saldo, Este período, Para mirar y Se repiten no cambian.

Los números salen de los mismos cálculos: `getMonthComparison`, `scoreFor`, `spendPct` del período de cobro si hay sueldo, y la suma redondeada de `avgAmount` de los recurrentes. Un +187% se muestra `+187%` y, abajo, «casi 3 veces más». Si no hay mes anterior, la pista es «Mes calendario» y el valor es «—».

Escritorio, cuando el panel mide 720px o más (en el viewport cabe desde que la columna, ya sin el sidebar, entra el anillo y el saldo): anillo a la izquierda, `Separator` vertical, saldo con `Amount` a la derecha, barra partida abajo del saldo. Abajo, tres celdas con divisores, sin íconos ni pastillas.

En 390 el saldo queda a la izquierda y el anillo chico a la derecha. La barra ocupa el ancho. Las tres celdas son filas etiqueta / valor.

La barra partida es ingreso (`--income`) contra gasto suave `oklch(0.72 0.09 25)`. El punto y el monto de Gastos usan `--expense`. Al pasar el mouse, el otro tramo y su leyenda bajan juntos a opacidad 0.35 en 250 ms, sin rebote. El selector de mes es el `Select` chico y muestra el mes calendario actual. No cambia de período: la pantalla no tiene otro.

Del sueldo es el porcentaje y una `Progress` de 4px en tinta `#171717`. Sin sueldo, el porcentaje es 0 y dice «Sin sueldo».

Pares que tienen que quedar parejos:

| Pantalla | Fila |
| --- | --- |
| Inicio | Flujo de caja / Gasto diario |
| Inicio | Gastos / Del sueldo |
| Inicio | Día por día / Comercios |
| Higiene | Saldo / Este período y el anterior |
| Higiene | Para mirar / Se repiten |
| Tarjetas | 1 columna; 2 desde `md`; 3 desde `xl`. Una sola queda en `max-w-md`. Cuotas usa el mismo ancho |
| Suscripciones | Este mes / Próximos cobros |

Nav inferior, solo `< md`, cinco ítems: Inicio, Movimientos, Sueldo, Higiene, Más. El contenido reserva `pb-[calc(4.6rem+env(safe-area-inset-bottom))]`. Sidebar `md:w-56`, contenido `md:ml-56`.

### Paleta de categorías

Punto chico, nunca el relleno del ícono. `DOT` en `src/components/viz/day-cylinders.tsx`:

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

Dona (`DONUT_COLORS` en `src/lib/chart-series.ts`): `#F5A04C`, `#3CB87A`, `#F2C14E`. El resto es `#F3EEE4` liso. Tira (`STRIP_COLORS`): `#8B7CF6`, `#6B93F5`, `#F0A05A`, `#3DCA86`, `#67B7F0`, `#F0734A`. Comercios, solo el punto: `#3b82f6`, `#f97316`, `#2F48A1`, `#14b8a6`.

### Componentes de pantalla

| Archivo | Para qué |
| --- | --- |
| `src/components/real-balance-panel.tsx` | Tarjeta de saldo en Inicio. Diálogos de ajustar y corregir |
| `src/components/money-agreement.tsx` | Los tres números en Movimientos. En Higiene el saldo está en Tu dinero. No lo dupliques en el saldo de Inicio |
| `src/components/tu-dinero-panel.tsx` | Arriba de Higiene. Un solo panel: mes, anillo, saldo, barra partida y tres datos |
| `src/components/sidebar.tsx` | Nav de escritorio y barra inferior |
| `src/components/transaction-list.tsx` | Lista de movimientos |
| `src/components/transaction-form.tsx` | Alta de movimiento |
| `src/components/salary-setup.tsx` | Alta y edición del sueldo |
| `src/components/salary-countdown.tsx` | Cobro que viene |
| `src/components/salary-history.tsx` | Cobros anteriores |
| `src/components/salary-review.tsx` | Sueldos para revisar |
| `src/components/goal-card.tsx` / `goal-form.tsx` | Una meta y su formulario |
| `src/components/subscription-form.tsx` | Alta de suscripción |
| `src/components/service-mark.tsx` | Isotipo de un servicio en `IconWell`. El color de la marca queda en el trazo; el pozo sigue neutro. Si no hay marca, monograma. Las siluetas CC0 están en `src/components/marks/` |
| `src/components/card-form.tsx` / `installment-form.tsx` | Tarjeta y cuotas. La tarjeta guarda día de cierre y de vencimiento, opcionales |
| `src/components/credit-card-visual.tsx` | Cara (`MetalCardFace`) al ancho de su celda, radio 12px. Vidrio satinado según la red, wordmark grande recortado, chip gris, últimos 4 abajo a la izquierda y el logo chico abajo a la derecha. El alias y el `···` van en la info, no sobre la cara. El monto va afuera, con `Amount` neutro |
| `src/components/network-mark.tsx` | Visa (silueta CC0, blanca sobre el metal), Mastercard (geometría propia, colores de la marca) y Amex (wordmark blanco de dos líneas, sin pastilla) |
| `src/components/login-form.tsx` | Entrar y crear cuenta |
| `src/components/status-banners.tsx` | Error de sync e importación |
| `src/components/shape-provider.tsx` | Sesión. `NEXT_PUBLIC_SHAPE_PREVIEW=1` carga datos locales |
| `src/components/user-guard.tsx` | Manda a login si no hay sesión |

`balance-card.tsx`, `metric-card.tsx`, `goals-mini.tsx` y `recent-transactions.tsx` no están en las pantallas. No los uses como modelo.

`transaction-list.tsx`, `transaction-form.tsx` y `money-agreement.tsx` también los usa Movimientos. Si les cambiás la firma, anotalo en el PR.

Pantallas: `src/app/(main)/page.tsx` (Inicio), `transactions`, `salary`, `health` (Higiene), `cards`, `subscriptions`, `goals`, `profile`, y `src/app/login/page.tsx`.

### Mi perfil

`src/app/(main)/profile/page.tsx`. Sigue el shell: sidebar desde `md`, barra inferior en el teléfono. Foto, nombre, guardar y cerrar sesión quedan.

Escritorio: el fondo de la página es el de la app. La ficha, de hasta 680px y alineada arriba como el resto de las pantallas, lleva el título «Mi perfil». La banda es un cielo índigo en CSS (sin foto de stock) con corte neto. No pinta el resto de la página. El isotipo o la foto se sienta sobre la banda, con una chapita para cambiar la foto. El nombre, el email si la cuenta lo tiene, y un chip «Confirmado» solo cuando el email está confirmado. La fila usa datos reales: desde (alta de la cuenta o el primer dato), movimientos de este mes, tarjetas y suscripciones activas. Nombre editable y email de solo lectura, con divisor fino. Abajo a la derecha, Cancelar y Guardar cambios. Cerrar sesión queda debajo de la ficha.

Móvil: fondo blanco con un tinte mínimo. Título «Perfil», marca o foto grande, «Hola, {nombre}». Dos atajos, Tarjetas y Suscripciones, con el conteo real. «Tu cuenta» agrupa nombre y foto. «General» tiene cerrar sesión, texto de gasto, pozo blanco e ícono oscuro. No hay notificaciones ni ayuda: la app no las tiene. Si hay datos viejos en el navegador, aparece la fila para importarlos.

La ficha entra en 220 ms, ease-out, y no se mueve con `prefers-reduced-motion`.

### Puntero

No hay imágenes en `public/cursors`.

En escritorio, y solo si `(hover: hover) and (pointer: fine)`, el Pointer de Magic UI (MIT, variante de color) reemplaza el cursor en toda la app. Tinta `#171717` (el negro de Geist) y filete blanco, sin gradiente y sin `--brand`. `#171717` se lee sobre el fondo claro. El filete lo separa del botón índigo y de las barras oscuras. `#0a0a0a` queda demasiado cerrado y el filete se pierde. El componente es `src/components/ui/pointer.tsx`. Entra en 200 ms y sale en 160 ms, ease-out. La posición sigue al mouse 1:1, sin resorte. `pointer-events: none`: no tapa el click ni mueve el layout. Es client component y no lee `window` en el server.

En un campo de texto, un `textarea` o un `contenteditable`, el puntero se esconde y queda el I-beam nativo. En un control deshabilitado (`:disabled` o `aria-disabled`) queda `not-allowed`.

En táctil no se monta. Con `prefers-reduced-motion: reduce` el puntero sigue, pero sin la escala de entrada ni de salida: aparece ya en su lugar y se mueve 1:1. Es el cursor de la app, no un adorno. Sacarlo dejaría el del sistema solo para quien pidió menos movimiento, y el cambio de forma se siente más que la transición. Lo que se apaga es la animación, no el seguimiento.

El porcentaje del sueldo vive en Del sueldo, no en el saldo.
