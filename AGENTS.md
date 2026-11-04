<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

# UI

Antes de tocar interfaz, layout, estilos, gráficos o textos, leé `DESIGN.md` en la raíz y seguilo. Es la fuente única del sistema visual de Shape. Si el documento y el código no coinciden, el código manda: actualizá `DESIGN.md` en el mismo cambio.

En cualquier trabajo de UI usá también Impeccable (`.cursor/skills/impeccable`, Apache 2.0). Antes de editar, corré `.cursor/skills/impeccable/scripts/impeccable context` y leé `reference/craft-floor.md`. Al cerrar, corré `scripts/impeccable detect` sobre lo que cambiaste y revisalo con los flujos `audit` y `critique` del skill. Si Impeccable y `DESIGN.md` no coinciden, manda `DESIGN.md`: voz, tokens, primitivas, montos, movimiento y la sección Shape. El binario del motor no se versiona; el launcher lo baja la primera vez.
