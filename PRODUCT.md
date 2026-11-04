# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

Personas en Argentina que miran su plata en el teléfono o en la compu: sueldo, gastos, tarjetas, suscripciones y metas. Inferido del producto y de DESIGN.md; no hubo ronda de confirmación porque el encargo ya cerraba estos hechos.

## Product Purpose

Shape guarda las finanzas personales y las muestra en orden: qué entró, qué salió y qué queda hasta el próximo cobro.

## Positioning

Un gestor personal en español rioplatense, en pesos, con el sueldo como eje. No es un home banking ni un presupuesto traducido.

## Operating Context

App web (Next.js) con sesión de Supabase. El teléfono es el uso diario; el escritorio es la misma cuenta en una pantalla más ancha. Hay un atajo de iOS para anotar un gasto.

## Capabilities and Constraints

- Cuenta con email y contraseña. El alta pide nombre y una foto opcional. Si Supabase pide confirmación, avisa y vuelve a la entrada.
- No hay proveedores OAuth ni magic link en el código.
- Moneda principal ARS. USD se muestra aparte.
- Voz: español rioplatense, voseo. Números y fechas en es-AR.
- Repositorio público: sin assets pagos ni con licencia que prohíba publicarlos.
- El modo oscuro de la app existe en CSS y no está activo.

## Brand Commitments

Nombre Shape. Marca `#2F48A1`. Fuente Geist. Radio base `1rem`. Entrar, en escritorio, es una ficha oscura sobre un cielo propio; en el teléfono, pantalla completa clara. El puntero propio solo existe con mouse fino.

## Evidence on Hand

La app en `src/`. No hay testimonios, precios ni métricas de clientes. La fila de entrar (Sueldo, Gastos, Metas) describe qué guarda el producto; no son cifras.

## Product Principles

- La plata se lee de un vistazo.
- Poco texto, en rioplatense.
- El color de un monto no pinta el ícono.
- Entrar es obvio en el teléfono y reconocible en el escritorio.
