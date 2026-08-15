# Design: `model-router` — skill global de distribución de modelos

**Fecha:** 2026-07-12
**Estado:** Aprobado, listo para plan de implementación
**Alcance:** Herramienta global de Claude Code (`~/.claude/`), no pertenece a ningún repo en particular.

---

## 1. Problema

El usuario tiene acceso a muchos modelos repartidos en dos herramientas distintas y quiere repartir el trabajo de desarrollo entre ellos para **ahorrar presupuesto de Claude nativo** sin resignar calidad:

- **Claude Code (nativos, gastan presupuesto Claude):** Opus 4.8, Sonnet 5, Haiku 4.5, Fable 5.
- **Antigravity vía CLI `agy` (gastan cuota de Antigravity, NO el presupuesto Claude):**
  - Gemini 3.5 Flash (Low / Medium / High)
  - Gemini 3.1 Pro (Low / High)
  - Claude Sonnet 4.6 (Thinking)
  - Claude Opus 4.6 (Thinking)
  - GPT-OSS 120B (Medium) — excluido por defecto (el usuario no lo usa)

**Restricción dura:** en los proyectos de trabajo el usuario prefiere gastar Claude nativo. El router NO debe activarse ahí.

---

## 2. Hechos verificados

Antes de diseñar se verificó el pipeline en la terminal:

- `agy` existe en `C:\Users\jdiaz483\AppData\Local\agy\bin\agy`.
- `agy --print --model "<nombre>" --dangerously-skip-permissions "<prompt>"` corre un prompt **no interactivo** y devuelve la respuesta por stdout. `--print-timeout` default 5m.
- Los nombres de modelo se pasan **verbatim** tal como los lista `agy models`.
- El pipeline se probó de punta a punta con `Gemini 3.5 Flash (Low)` y respondió correctamente.
- Los modelos nativos de subagente se seleccionan con el parámetro `model` del tool Agent: `opus`, `sonnet`, `haiku`, `fable`.

---

## 3. Decisiones de diseño (aprobadas)

| # | Decisión | Elección |
|---|---|---|
| 1 | Control | **Propongo y el usuario aprueba** antes de despachar. Nunca ruteo en silencio. |
| 2 | Sesgo de ruteo | **Equilibrado** (mecánico → barato; lógica media → medio; difícil → alto). |
| 3 | Frontera de trabajo | Router **prohibido** en todo lo que cuelgue de `Documents\work` **excepto** `Documents\work\my-proyects`. |
| 4 | Enforcement de la frontera | **Candado duro:** disciplina en la skill + hook `PreToolUse` que bloquea `agy`. |
| 5 | Verificación | Todo output de modelo débil se verifica sobre el **artefacto real** (no el resumen) con un revisor nativo más fuerte. |

---

## 4. Arquitectura

Una sola **skill global** (`~/.claude/skills/model-router/SKILL.md`) más un **hook** de enforcement. No hace falta un agente dedicado: la decisión de ruteo la toma el hilo principal (Claude Opus 4.8), que actúa de **arquitecto + revisor**. La ejecución se delega.

```
Hilo principal (Opus 4.8) = ARQUITECTO
   │  clasifica tarea → propone modelo + revisor → espera OK
   ▼
Despacho
   ├─ Modelos Claude nativos  → tool Agent con model: opus|sonnet|haiku|fable
   └─ Modelos agy             → Bash: agy --print --model "..." --dangerously-skip-permissions "<tarea autocontenida>"
   ▼
Verificación (sobre el diff/archivos reales)
   ├─ trivial  → chequeo inline del hilo principal
   ├─ media    → subagente Sonnet 5 nativo
   └─ difícil  → subagente Opus 4.8 nativo
   ▼
Resultado final al usuario
```

### 4.1 Insight central

`agy` ofrece **Claude Opus 4.6 y Sonnet 4.6**. Eso significa que se puede descargar hasta trabajo de alta calidad a `agy` sin tocar el presupuesto Claude nativo. La división que maximiza el ahorro:

- El hilo principal (Opus 4.8) **piensa, escribe el spec preciso de la subtarea y revisa**.
- `agy` **ejecuta** casi todo (lo "gratis").
- El Claude nativo (Opus 4.8 / Fable 5) queda reservado para lo más duro o cuando `agy` no alcanzó, y para **revisar** (revisar es mucho más barato que implementar).

### 4.2 Límite honesto

`agy --print` corre en un proceso separado, **sin acceso a la conversación**. Toda tarea delegada a `agy` debe ir **autocontenida** en el prompt: rutas de archivos, contexto necesario, restricciones del proyecto (Tailwind, no `any`, etc.) y **criterio de aceptación explícito**. Escribir ese spec y revisar el resultado es el rol que NO se delega.

---

## 5. Matriz de ruteo (equilibrado)

| Tipo de tarea | Propuesta primaria | Reserva | Revisor |
|---|---|---|---|
| Trivial (renombrar, boilerplate, formato, config simple) | `agy` Gemini 3.5 Flash (Low/Medium) | Haiku nativo | inline (hilo principal) |
| Tests simples, funciones directas | `agy` Gemini 3.5 Flash (High) | Haiku nativo | inline |
| Lógica media (componente, refactor moderado, hook, CRUD) | `agy` Gemini 3.1 Pro (High) o Claude Sonnet 4.6 | Sonnet 5 nativo | Sonnet 5 nativo |
| Difícil (arquitectura, debugging sutil, decisiones de diseño) | `agy` Claude Opus 4.6 (Thinking) | Opus 4.8 nativo | Opus 4.8 nativo |
| Lo más duro / novel / `agy` no alcanzó | Opus 4.8 nativo | Fable 5 nativo | Opus 4.8 nativo |

GPT-OSS 120B: excluido por defecto. Solo si el usuario lo pide explícitamente.

**Regla de escalado del revisor:** el revisor es siempre un modelo nativo **igual o más fuerte** que el ejecutor, capado en Opus 4.8. Nunca se usa un modelo débil para revisar a otro débil.

---

## 6. Flujo de ejecución (paso a paso)

1. **Gate de activación.** Antes de proponer ruteo, la skill comprueba el cwd. Si cae bajo `Documents\work` y NO bajo `Documents\work\my-proyects`, la skill **no se activa**: se trabaja con Claude nativo directo. En cualquier otro proyecto, sigue.
2. **Clasificación.** El hilo principal clasifica la tarea según la matriz (§5).
3. **Propuesta.** Presenta al usuario: modelo propuesto, revisor propuesto y el porqué. Espera aprobación.
4. **Despacho.**
   - Claude nativo → tool Agent con `model`.
   - `agy` → Bash con `agy --print --model "..." --dangerously-skip-permissions "<spec autocontenido + criterio de aceptación + pedido de resumen estructurado>"`.
5. **Resumen estructurado.** Al ejecutor `agy` se le pide devolver, además del trabajo: qué archivos tocó, qué asumió, qué riesgos ve.
6. **Verificación sobre artefacto real.** El revisor (según §5) lee los **cambios reales** (diff/archivos), corre/valida el criterio de aceptación y da veredicto: `pasa` | `tiene problemas`.
7. **Recuperación.** Si `tiene problemas`: re-despacho al mismo ejecutor con el feedback, o escalado a un modelo más fuerte. Máximo 2 reintentos antes de escalar a Claude nativo.
8. **Entrega.** El hilo principal entrega el resultado final al usuario con una nota de qué modelo lo hizo y cómo se verificó.

---

## 7. Enforcement — hook `PreToolUse`

Candado duro, independiente de que la skill se porte bien.

- **Tipo:** hook `PreToolUse` sobre el tool `Bash`.
- **Lógica:** si el comando invoca `agy` **y** el cwd cae bajo `Documents\work` sin ser `Documents\work\my-proyects` → **bloquea** la llamada y devuelve un mensaje explicando que en proyectos de trabajo se usa Claude nativo.
- **Ubicación:** configuración global de Claude Code (`~/.claude/settings.json`).
- **Comparación de rutas:** normalizada y case-insensitive (Windows), resistente a separadores `/` vs `\`.

La skill además lleva la instrucción de abstenerse (defensa en profundidad), pero el hook es la garantía real.

---

## 8. Componentes y responsabilidades

| Unidad | Qué hace | De qué depende |
|---|---|---|
| `SKILL.md` | Enseña al hilo principal: gate de activación, matriz de ruteo, cómo despachar a `agy` y a subagentes, cómo verificar. | Comando `agy` en PATH; tool Agent; tool Bash. |
| Hook `PreToolUse` | Bloquea `agy` en carpetas de trabajo. | `~/.claude/settings.json`; script de verificación de ruta. |
| Matriz de ruteo (dentro de `SKILL.md`) | Mapea tipo de tarea → modelo propuesto → revisor. | — |
| Convención de prompt para `agy` (dentro de `SKILL.md`) | Plantilla de tarea autocontenida + criterio de aceptación + pedido de resumen. | — |

---

## 9. Manejo de errores

- **`agy` no está en PATH** → la skill lo detecta y cae a Claude nativo, avisando al usuario.
- **Timeout de `agy --print`** (default 5m) → se reporta y se ofrece reintentar o escalar a nativo.
- **Ejecutor reporta éxito pero la verificación falla** → nunca se entrega como bueno; se aplica el paso 7 (recuperación).
- **Hook bloquea en carpeta de trabajo** → mensaje claro, no error silencioso.

---

## 10. Fuera de alcance (YAGNI)

- No hay ruteo automático sin aprobación (descartado por decisión #1).
- No se usa GPT-OSS por defecto.
- No se paraleliza multi-modelo sobre la misma tarea (no es un ensemble/tournament; es ruteo simple).
- No se toca ningún repo de trabajo.
- No se persiste histórico de ruteo (si más adelante se quiere métrica de ahorro, es otro cambio).

---

## 11. Criterios de éxito

1. En un proyecto permitido, ante una tarea de desarrollo, la skill propone un modelo y un revisor coherentes con la matriz y espera aprobación.
2. Al aprobar, la subtarea se ejecuta en el modelo elegido (`agy` o nativo) y el resultado se verifica sobre el artefacto real antes de entregarse.
3. En cualquier carpeta bajo `Documents\work` (salvo `my-proyects`), un intento de invocar `agy` es **bloqueado por el hook**.
4. El presupuesto Claude nativo se gasta principalmente en arquitectura y revisión, no en implementación masiva.
