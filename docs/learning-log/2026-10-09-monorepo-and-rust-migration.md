# 2026-10-09 — Monorepo + Rust/Wasm migration: what was done and why

**Area**: whole project
**Status**: shipped (Wasm core behind a flag, TS is the default)
**Related**: ADR 0001–0007, `openspec/changes/migrate-to-rust-core/`, `packages/core/LEARNING.md`

> Written in Spanish for study. Every claim cites the file it comes from.

## 1. Qué se hizo

- **Modelo de píxeles**: de un objeto por píxel (`RgbaColor[][]`) a un buffer plano `Uint8ClampedArray` que se pinta con `putImageData` (ADR 0001).
- **Un solo punto de entrada**: todo cambio al documento pasa por `dispatch(cmd)`; el "core" es dueño del documento (ADR 0002).
- **Undo por parches**: se guardan solo los bytes de la zona tocada, no copias del documento entero (ADR 0003).
- **Persistencia**: borradores de localStorage a IndexedDB detrás de un `DocumentRepository` (ADR 0006/0007).
- **Monorepo pnpm**: `apps/landing` (Next 16), `apps/editor` (Vite 6 SPA), `packages/tokens`, `packages/core` (Rust → Wasm) (ADR 0005).
- **IA**: las llamadas a IA pasan por Vercel Functions (`apps/editor/api/ai/*`) para no exponer las keys del servidor.
- **Rust/Wasm**: pixel-buffer → flood-fill → quantize/downscale → Document/history, detrás de `PixelKernels`/`PixelCore` y del flag `pf:core`/`VITE_PIXEL_CORE`. **El default sigue siendo `ts`.**
- **CI**: typecheck, tests, `cargo fmt/clippy/test/deny`, rebuild de `pkg/` con chequeo de drift, presupuesto de 150 KB gzip para el `.wasm` y `check-bench` (razón Wasm/TS).

## 2. Por qué (razones escritas en el repo)

| Decisión | Problema | Alternativas | Costo |
|---|---|---|---|
| Separar el monorepo (ADR 0005) | Un paquete Rust con su propio toolchain no encaja en el build de una app Next | Una sola app | Dos stacks con reglas distintas |
| Editor en Vite, no Next (ADR 0005) | El editor es canvas puro, solo cliente, y pagaba un costo por SSR/RSC | Seguir en Next | Perder `next/image`/`next/font`, reescribir la navegación |
| "Primero el modelo de datos, después el lenguaje" (`design.md`) | Hacer el port mecánico, no una reescritura | Portar todo a Rust de una | Más fases |
| Buffer plano (ADR 0001) | Un objeto por píxel es lento y pesado | `Uint32Array`, seguir con objetos | Reescribir todos los `lib/*` de píxeles |
| `dispatch` + dos interfaces (ADR 0002) | El store mutaba capas desde muchos lugares; dos copias se desincronizaban | Una sola interfaz | Más estructura |
| Undo por dirty-rect (ADR 0003) | Clonar todo en cada paso | Snapshots copy-on-write | Más complejidad; varias rondas de bugs |
| Frontera Rust plana, sin serde (ADR 0004) | Superficie mínima para alguien nuevo en Rust | `serde-wasm-bindgen` | Codificación manual (un bug con el separador NUL) |
| TS como referencia + tests de paridad (proposal) | Sin referencia no hay forma de saber si Rust hace lo mismo | Reemplazar TS | Mantener dos implementaciones |
| `pkg/` commiteado + drift check (D9) | Compilar Rust en Vercel es lento y frágil | npm, build en Vercel | Builds reproducibles entre Windows y Linux |
| IndexedDB local-first (ADR 0006/0007) | localStorage ~5 MB; base64 suma un 33% | Supabase ya | La nube queda para después, como segundo adaptador |

## 3. Qué se midió (`openspec/changes/migrate-to-rust-core/baseline-bench.md`)

| Qué | Antes | Después |
|---|---|---|
| Undo de un trazo de 1 px | 589,824 B | **8 B** |
| Flood fill 256×256: objetos → buffer plano (en TS) | 50.36 ms | **~2.6 ms** |
| Flood fill scanline lleno: TS vs Wasm | 0.44 ms | 0.32 ms (~1.3×) |
| quantize 64×64 a 16 colores: TS vs Wasm | 5.51 ms | 1.51 ms (~3.6×) |
| downscale 512→64: TS vs Wasm | 3.81 ms | 4.51 ms (más lento) → 1.33 ms tras corregir el algoritmo |
| 2000 llamadas de un píxel: TS vs Wasm | 0.098 ms | 145.5 ms (**~1481× más lento**) |
| Gesto real de dibujo en el store | — | Wasm **1.5–2× más lento** |
| Costo de copiar datos JS↔Wasm dentro de un flood fill | — | ~1.6% del tiempo |

**No medido o débil**: el repintado se midió con un stub, no en un browser. El 50 ms inicial no tenía warmup. La meta de "flood fill ≥3× más rápido que TS" no se cumplió. Faltan el deploy real, el tamaño del bundle de producción y probar Wasm del Document en un browser real.

## 4. Cómo funciona WebAssembly de verdad

Rust **no** se convierte en JavaScript. `wasm-pack` lo compila a un **binario `.wasm`** y wasm-bindgen genera el "pegamento" JS (`packages/core/pkg/`). El navegador ejecuta ese binario en su propia máquina virtual, **al lado** del motor JS. Wasm tiene su propia memoria (memoria lineal), así que cada llamada **cruza una frontera** y copia datos de ida y vuelta. Por eso miles de llamadas chiquitas pierden (1481×) y pocas llamadas con mucho cálculo ganan (quantize 3.6×).

## 5. Preguntas de entrevista y respuestas honestas

- **¿Por qué Rust si TS ya era rápido?** La gran ganancia fue el modelo de datos en TS. Rust gana en cálculo pesado y pierde en el gesto real de dibujo, por eso hay un flag y TS por defecto.
- **¿Cómo sabes que Rust hace lo mismo?** Tests de paridad (`describe.each(['ts','wasm'])`) y un fuzz diferencial de 300 semillas, que encontró un bug real (`LEARNING.md` §32).
- **¿Mediste o adivinaste?** Se adivinó mal dos veces (la copia FFI y un `HashMap` en downscale) y se corrigió midiendo.
- **¿Cómo evitas regresiones?** `scripts/check-bench.ts` compara razones Wasm/TS de la misma corrida y falla si falta un grupo de bench.
- **¿Qué harías distinto?** PRs chicos de verdad (uno de los commits tiene 17k líneas) y agrupar los puntos del trazo por cuadro antes de decidir el default.

## 6. Historias para contar

1. **Rust no fue la gran ganancia; el modelo de datos sí.** Flood fill de 50 ms a 2.6 ms y undo de 576 KB a 8 bytes, en TypeScript.
2. **Un algoritmo mejor hizo que Wasm "ganara por menos".** Los dos se aceleraron unas 5×, y la ventaja de Wasm bajó de 2.5× a 1.3×.
3. **Medí, Wasm perdió en el caso real, y por eso TS sigue por defecto.** Quedó documentado y como gate en CI, en vez de esconderlo.

## Pendientes encontrados (tooling)

- `design-agent.md` no existe aunque `AGENTS.md`/`CLAUDE.md`/`/implementar` lo nombran; `test-agent` tampoco existe; la descripción de `frontend-agent` todavía dice "Next.js".
- `.github/skills/impeccable` duplica la skill con un `.exe` de unos 19 MB.
- `.claude/settings.local.json` es "local" pero está commiteado.
