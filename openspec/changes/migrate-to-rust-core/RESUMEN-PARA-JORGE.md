# Resumen para Jorge — migración a Rust

**Terminé el 9 de octubre de 2026 a las 10:43 p. m. (hora Colombia).**
**Apagué el PC a las 10:46 p. m. (hora Colombia).**
Trabajamos desde más o menos las 11 a. m. o el mediodía.

## Lo más importante en 5 líneas

1. Están hechas las 8 fases del plan (0 a 7), cada una con sus pruebas y con dos revisores (Sonnet y Opus).
2. Todo quedó guardado en git **solo en tu PC**, con tu cuenta personal (JDavidcor23). No subí nada.
3. El editor ya es mucho más rápido **sin depender de Rust**: dibujar en pantalla es 5 veces más rápido y el deshacer pasó de copiar 576 KB a guardar 8 bytes.
4. Las herramientas pesadas ya usan Rust: el bote de pintura, reducir colores y redimensionar.
5. El "cerebro" completo en Rust (documento + deshacer) **existe pero está apagado por defecto**. Hoy, en el ciclo completo del editor, todavía es entre 1.5 y 2 veces **más lento** que la versión TypeScript, por el costo de pasar datos entre JavaScript y Rust. No lo encendí porque no lo podía probar en un navegador y ahí van los dibujos de tus usuarios.

## Commits que quedaron (rama `feat/migrate-to-rust-core`)

- `e109d00` documentación del plan (openspec, decisiones de arquitectura)
- `bf56e74` fases 0 a 5 (pruebas, píxeles planos, deshacer nuevo, monorepo con Vite, primer paquete Rust, bote de pintura en Rust)
- `a815aa3` y `834cab2` fase 6 y sus arreglos (colores y redimensionar en Rust)
- `39ced9f`, `d8860a6`, `ae99263` fase 7 y sus arreglos (documento y deshacer en Rust, detrás de un interruptor)

## Problemas que aparecieron y cómo se resolvieron

- **El deshacer revivía píxeles borrados y caía en el frame equivocado.** Causa: algunas acciones no pasaban por el historial y se ubicaban los frames por posición. Solución: todo cambio al documento pasa por el historial y los frames/capas se ubican por id.
- **Se perdía el último trazo al cambiar de sección.** Solución: el autoguardado guarda antes de salir y nunca pisa un borrador más nuevo.
- **El trazo no se veía mientras dibujabas** (bug que metimos nosotros y que atrapó un revisor). Solución: el canvas se redibuja por número de revisión, no por "si cambió el objeto".
- **Rust se podía romper con datos raros** (tamaños gigantes, números negativos). Solución: todas las cuentas en Rust están protegidas y nunca se cae con datos del usuario.
- **El `.wasm` salía distinto en Windows y en Linux.** Solución: un script de compilación que lo deja idéntico en cualquier sistema.
- **Redimensionar en Rust era más lento que TS.** No era por copiar datos, como creímos al principio, sino por cómo guardaba conteos. Con una tabla plana quedó 2.8 veces más rápido.
- **El interruptor de Rust no hacía nada y un fallo de Rust podía hacerte perder trabajo.** Solución: ahora el interruptor sí funciona, y si Rust falla el editor pasa solo a TypeScript sin perder lo dibujado (sí se pierde el historial de deshacer de esa sesión).

## Lecciones para el futuro

- Medir antes de optimizar: dos veces creímos saber por qué algo era lento y la medición dijo otra cosa.
- Rust no es magia: gana en cálculos pesados, pero cruzar datos entre JavaScript y Rust cuesta. La arquitectura importa más que el lenguaje.
- La revisión doble (Sonnet + Opus) encontró bugs reales en casi todas las fases.

## Lo que te toca a ti

1. Revisar los commits y, si te gustan, hacer `git push` (yo no subí nada).
2. Crear los dos proyectos en Vercel (landing y editor) y desplegar.
3. Probar el editor a mano con la lista `editor-feature-parity-checklist.md`.
4. Crear los archivos `.env.example` (el sistema no me dejó crear archivos `.env*`; los nombres están en `tasks.md`, tarea 4f.11).
5. Si quieres probar el cerebro en Rust: en la consola del navegador `localStorage.setItem('pf:core','wasm')` y recargar. Para volver: `localStorage.setItem('pf:core','ts')`.
6. Correr `/gp-init` conmigo para dejar las reglas de código limpio, y después crear las reglas para Rust.

## Pendientes técnicos (detalle en `HANDOFF.md`)

- Hacer que el cerebro en Rust sea más rápido de punta a punta antes de activarlo por defecto.
- Ampliar las pruebas aleatorias del modo Rust y terminar algunas validaciones de números.
- Limpiar memoria de capas borradas en el modo Rust (requiere un ajuste al historial).
