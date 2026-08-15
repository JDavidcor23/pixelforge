# Model Router Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Crear una skill global `model-router` que proponga (con aprobación del usuario) a qué modelo despachar cada tarea de desarrollo, más un hook duro que bloquee `agy` en los proyectos de trabajo.

**Architecture:** Una skill markdown en `~/.claude/skills/model-router/SKILL.md` guía al hilo principal (Opus 4.8) como arquitecto+revisor: clasifica la tarea, propone modelo y revisor, y al aprobar despacha a `agy --print` (modelos no-nativos) o a un subagente nativo (`model: opus|sonnet|haiku|fable`). El output de modelos débiles se verifica sobre el artefacto real. Un hook `PreToolUse` en Node bloquea cualquier invocación de `agy` cuando el cwd cae bajo `Documents\work` salvo `my-proyects`.

**Tech Stack:** Claude Code (skills + hooks), Node.js (script del hook + `node:test`), CLI `agy` (Antigravity), tool Agent nativo.

## Global Constraints

- El router se abstiene en cualquier ruta bajo `<home>\Documents\work` EXCEPTO `<home>\Documents\work\my-proyects`. (§3 spec, decisión #3)
- Control siempre propuesta-y-aprobación: nunca despachar sin OK del usuario. (decisión #1)
- Verificación siempre sobre el artefacto real (diff/archivos), nunca solo sobre el resumen del ejecutor. (decisión #5)
- Sesgo de ruteo: equilibrado, según la matriz de §5 del spec.
- GPT-OSS 120B: excluido por defecto.
- Comando `agy` verbatim: `agy --print --model "<nombre exacto de agy models>" --dangerously-skip-permissions "<prompt>"`. `--print-timeout` default 5m.
- Nombres de modelo nativo para el tool Agent: `opus`, `sonnet`, `haiku`, `fable`.
- Máximo 2 reintentos en un ejecutor antes de escalar a Claude nativo. (§6 spec)

**Spec de referencia:** `docs/superpowers/specs/2026-07-12-model-router-design.md`

---

### Task 1: Hook guard `agy-work-guard` (con tests unitarios)

Es la única pieza con lógica real testeable. Función pura `decide()` + entrypoint que lee stdin del hook.

**Files:**
- Create: `C:\Users\jdiaz483\.claude\hooks\agy-work-guard.js`
- Test: `C:\Users\jdiaz483\.claude\hooks\agy-work-guard.test.js`

**Interfaces:**
- Produces: `decide({ command: string, cwd: string, home: string }) => { deny: boolean, reason: string }` (export CommonJS). Consumido por el test y por el propio entrypoint del hook.

- [ ] **Step 1: Escribir el test que falla**

Create `C:\Users\jdiaz483\.claude\hooks\agy-work-guard.test.js`:

```js
const { test } = require('node:test');
const assert = require('node:assert');
const { decide } = require('./agy-work-guard.js');

const HOME = 'C:\\Users\\jdiaz483';

test('bloquea agy en un proyecto de trabajo', () => {
  const r = decide({
    command: 'agy --print --model "Gemini 3.5 Flash (Low)" "hola"',
    cwd: 'C:\\Users\\jdiaz483\\Documents\\work\\ixc-omni-pat-portal',
    home: HOME,
  });
  assert.strictEqual(r.deny, true);
  assert.ok(r.reason.length > 0);
});

test('permite agy en Documents\\work\\my-proyects', () => {
  const r = decide({
    command: 'agy --print "hola"',
    cwd: 'C:\\Users\\jdiaz483\\Documents\\work\\my-proyects\\pixelforge',
    home: HOME,
  });
  assert.strictEqual(r.deny, false);
});

test('permite agy fuera del arbol de trabajo', () => {
  const r = decide({
    command: 'agy --print "hola"',
    cwd: 'C:\\Users\\jdiaz483\\Documents\\personal\\game',
    home: HOME,
  });
  assert.strictEqual(r.deny, false);
});

test('permite comandos que no son agy dentro de un proyecto de trabajo', () => {
  const r = decide({
    command: 'npm run build',
    cwd: 'C:\\Users\\jdiaz483\\Documents\\work\\ixc-omni-pat-portal',
    home: HOME,
  });
  assert.strictEqual(r.deny, false);
});

test('bloquea agy invocado por ruta absoluta en un proyecto de trabajo', () => {
  const r = decide({
    command: 'C:\\Users\\jdiaz483\\AppData\\Local\\agy\\bin\\agy --print "hola"',
    cwd: 'C:\\Users\\jdiaz483\\Documents\\work\\algun-repo',
    home: HOME,
  });
  assert.strictEqual(r.deny, true);
});

test('no confunde palabras que contienen agy (stagy)', () => {
  const r = decide({
    command: 'echo stagy',
    cwd: 'C:\\Users\\jdiaz483\\Documents\\work\\repo',
    home: HOME,
  });
  assert.strictEqual(r.deny, false);
});
```

- [ ] **Step 2: Correr el test para verificar que falla**

Run: `cd "C:\Users\jdiaz483\.claude\hooks" && node --test`
Expected: FAIL — `Cannot find module './agy-work-guard.js'`.

- [ ] **Step 3: Implementar el script mínimo**

Create `C:\Users\jdiaz483\.claude\hooks\agy-work-guard.js`:

```js
'use strict';

// Normaliza una ruta: separadores a '/', minusculas, sin barra final.
function norm(s) {
  return String(s || '').replace(/\\/g, '/').toLowerCase().replace(/\/+$/, '');
}

// Detecta si el comando invoca `agy` como token de comando
// (soporta `agy`, `agy.exe`, `./agy`, ruta absoluta `...\bin\agy`).
function invokesAgy(command) {
  return /(?:^|[\s;&|(])(?:[^\s;&|(]*[\\/])?agy(?:\.exe)?(?:$|[\s"';&|)])/i.test(
    String(command || '')
  );
}

// Decision pura: deny=true si se invoca agy dentro de la carpeta de trabajo
// protegida (Documents/work salvo Documents/work/my-proyects).
function decide({ command = '', cwd = '', home = '' }) {
  const h = norm(home);
  const c = norm(cwd);
  const workRoot = `${h}/documents/work`;
  const exception = `${workRoot}/my-proyects`;

  const underWork = c === workRoot || c.startsWith(`${workRoot}/`);
  const underException = c === exception || c.startsWith(`${exception}/`);
  const isWorkProtected = underWork && !underException;

  if (isWorkProtected && invokesAgy(command)) {
    return {
      deny: true,
      reason:
        'En proyectos de trabajo (Documents\\work) se usa Claude nativo. `agy` esta bloqueado aca por decision del usuario. Usa un subagente nativo o el hilo principal.',
    };
  }
  return { deny: false, reason: '' };
}

module.exports = { decide, invokesAgy, norm };

// Entrypoint del hook PreToolUse: lee JSON por stdin, si corresponde
// emite una decision "deny" por stdout. Silencio + exit 0 = permitir.
if (require.main === module) {
  const os = require('os');
  let raw = '';
  process.stdin.setEncoding('utf8');
  process.stdin.on('data', (d) => (raw += d));
  process.stdin.on('end', () => {
    let input = {};
    try {
      input = JSON.parse(raw || '{}');
    } catch {
      process.exit(0); // input ilegible: no bloquear
    }
    const command = (input && input.tool_input && input.tool_input.command) || '';
    const cwd = (input && input.cwd) || process.cwd();
    const { deny, reason } = decide({ command, cwd, home: os.homedir() });
    if (deny) {
      process.stdout.write(
        JSON.stringify({
          hookSpecificOutput: {
            hookEventName: 'PreToolUse',
            permissionDecision: 'deny',
            permissionDecisionReason: reason,
          },
        })
      );
    }
    process.exit(0);
  });
}
```

- [ ] **Step 4: Correr el test para verificar que pasa**

Run: `cd "C:\Users\jdiaz483\.claude\hooks" && node --test`
Expected: PASS — 6 tests, 0 fallos.

- [ ] **Step 5: Smoke test del entrypoint por stdin (bloqueo real)**

Run:
```bash
echo '{"tool_name":"Bash","cwd":"C:\\Users\\jdiaz483\\Documents\\work\\ixc-omni-pat-portal","tool_input":{"command":"agy --print \"x\""}}' | node "C:\Users\jdiaz483\.claude\hooks\agy-work-guard.js"
```
Expected: imprime un JSON con `"permissionDecision":"deny"`.

- [ ] **Step 6: Smoke test del entrypoint por stdin (permitido)**

Run:
```bash
echo '{"tool_name":"Bash","cwd":"C:\\Users\\jdiaz483\\Documents\\work\\my-proyects\\pixelforge","tool_input":{"command":"agy --print \"x\""}}' | node "C:\Users\jdiaz483\.claude\hooks\agy-work-guard.js"
```
Expected: sin salida (permite). Exit code 0.

- [ ] **Step 7: Commit** (solo si el usuario pidio versionar; `~/.claude` normalmente no es repo)

Estos archivos viven en `~/.claude`, fuera de cualquier repo del proyecto. No commitear salvo pedido explicito.

---

### Task 2: Registrar el hook en la config global

**Files:**
- Modify: `C:\Users\jdiaz483\.claude\settings.json`

**Interfaces:**
- Consumes: `agy-work-guard.js` de Task 1 (ruta absoluta).

- [ ] **Step 1: Leer la config actual**

Read `C:\Users\jdiaz483\.claude\settings.json` completo. Si no existe, se crea con `{}`.

- [ ] **Step 2: Mergear la entrada del hook**

Agregar (o mergear sin pisar hooks existentes) esta estructura bajo `hooks.PreToolUse`. Si `hooks.PreToolUse` ya existe como array, **append** este objeto matcher; no reemplazar el array.

```json
{
  "hooks": {
    "PreToolUse": [
      {
        "matcher": "Bash",
        "hooks": [
          {
            "type": "command",
            "command": "node \"C:\\Users\\jdiaz483\\.claude\\hooks\\agy-work-guard.js\""
          }
        ]
      }
    ]
  }
}
```

- [ ] **Step 3: Validar que el JSON es valido**

Run: `node -e "JSON.parse(require('fs').readFileSync('C:/Users/jdiaz483/.claude/settings.json','utf8')); console.log('OK')"`
Expected: `OK`.

---

### Task 3: Skill `model-router`

Markdown. No hay test unitario; la verificacion es estructural (frontmatter valido) y en vivo (Task 4).

**Files:**
- Create: `C:\Users\jdiaz483\.claude\skills\model-router\SKILL.md`

- [ ] **Step 1: Crear el archivo de la skill con el contenido completo**

Create `C:\Users\jdiaz483\.claude\skills\model-router\SKILL.md`:

````markdown
---
name: model-router
description: Use when about to do development work (implement a feature, refactor, generate code, write tests, fix a bug) in a personal project — proposes routing each subtask to the most cost-effective model to save native Claude budget. Dispatches to the agy CLI (Gemini 3.x, Claude 4.6) or to native subagents (opus/sonnet/haiku/fable), then verifies weaker-model output against the real artifact. Does NOT activate in work projects under Documents\work (except Documents\work\my-proyects).
---

# Model Router

Repartis el trabajo de desarrollo entre muchos modelos para ahorrar presupuesto
de Claude nativo, SIN resignar calidad. Actuas de arquitecto + revisor; la
ejecucion se delega.

## 1. Gate de activacion (chequear SIEMPRE primero)

Mira el cwd actual.

- Si cae bajo `<home>\Documents\work` y NO bajo `<home>\Documents\work\my-proyects`
  → **NO uses esta skill.** Es un proyecto de trabajo: trabaja con Claude nativo
  directo. (El hook `agy-work-guard` bloquea `agy` aca de todos modos.)
- En cualquier otro proyecto → segui.

## 2. Regla de control (INNEGOCIABLE)

Nunca despaches en silencio. Para cada tarea/subtarea:
1. Clasificala (§3).
2. Proponele al usuario: **modelo ejecutor + revisor + por que**.
3. Espera su OK.
4. Recien ahi despachas.

## 3. Matriz de ruteo (equilibrado)

| Tipo de tarea | Ejecutor propuesto | Reserva | Revisor |
|---|---|---|---|
| Trivial (renombrar, boilerplate, formato, config simple) | `agy` Gemini 3.5 Flash (Low/Medium) | Haiku nativo | chequeo inline (vos) |
| Tests simples, funciones directas | `agy` Gemini 3.5 Flash (High) | Haiku nativo | chequeo inline |
| Logica media (componente, refactor moderado, hook, CRUD) | `agy` Gemini 3.1 Pro (High) o Claude Sonnet 4.6 (Thinking) | Sonnet 5 nativo | Sonnet 5 nativo |
| Dificil (arquitectura, debugging sutil, decisiones) | `agy` Claude Opus 4.6 (Thinking) | Opus 4.8 nativo | Opus 4.8 nativo |
| Lo mas duro / novel / agy no alcanzo | Opus 4.8 nativo | Fable 5 nativo | Opus 4.8 nativo |

- GPT-OSS 120B: excluido salvo pedido explicito.
- El revisor es siempre un modelo nativo **igual o mas fuerte** que el ejecutor,
  capado en Opus 4.8. Nunca un modelo debil revisa a otro debil.

## 4. Despacho

### 4a. Modelos de agy (no gastan presupuesto Claude)

```bash
agy --print --model "<nombre exacto>" --dangerously-skip-permissions "<prompt autocontenido>"
```

Nombres validos (verbatim, de `agy models`):
`Gemini 3.5 Flash (Low)`, `Gemini 3.5 Flash (Medium)`, `Gemini 3.5 Flash (High)`,
`Gemini 3.1 Pro (Low)`, `Gemini 3.1 Pro (High)`,
`Claude Sonnet 4.6 (Thinking)`, `Claude Opus 4.6 (Thinking)`.

**`agy --print` corre en un proceso separado, sin acceso a esta conversacion.**
El prompt DEBE ser autocontenido:
- Rutas absolutas de los archivos a leer/tocar.
- Contexto necesario y reglas del proyecto (ej: Tailwind, no `any`, no inline styles).
- **Criterio de aceptacion explicito.**
- Pedido final: "Al terminar devolve un resumen estructurado: archivos tocados,
  que asumiste, riesgos que ves."

### 4b. Modelos Claude nativos (gastan presupuesto Claude)

Usar el tool Agent con `model`: `opus`, `sonnet`, `haiku`, `fable`.

## 5. Verificacion (sobre el artefacto REAL)

Un ejecutor debil puede reportar exito falso. Nunca confies en su resumen.

1. El revisor (segun §3) lee los **cambios reales** (diff / archivos), no el resumen.
2. Corre/valida el **criterio de aceptacion**.
3. Veredicto: `pasa` | `tiene problemas`.
4. Si `tiene problemas` → re-despacho al mismo ejecutor con el feedback, o escala
   a un modelo mas fuerte. **Maximo 2 reintentos** antes de escalar a Claude nativo.

## 6. Entrega

Al usuario: resultado final + nota de **que modelo lo hizo y como se verifico**.

## 7. Fallbacks

- `agy` no esta en PATH → avisar y caer a Claude nativo.
- Timeout de `agy --print` (5m) → reportar y ofrecer reintentar o escalar.
- Nunca entregar como bueno algo que no paso verificacion.
````

- [ ] **Step 2: Validar el frontmatter y la ubicacion**

Run: `node -e "const fs=require('fs');const t=fs.readFileSync('C:/Users/jdiaz483/.claude/skills/model-router/SKILL.md','utf8');const m=t.startsWith('---')&&t.indexOf('name: model-router')>0&&t.indexOf('description:')>0;console.log(m?'OK':'FALTA FRONTMATTER')"`
Expected: `OK`.

---

### Task 4: Verificacion end-to-end (en vivo)

Automatizable solo en parte; el disparo real de skill+hook requiere reiniciar la sesion de Claude Code.

**Files:** ninguno (verificacion).

- [ ] **Step 1: Re-correr los tests del hook**

Run: `cd "C:\Users\jdiaz483\.claude\hooks" && node --test`
Expected: PASS, 6 tests.

- [ ] **Step 2: Confirmar los tres archivos en su lugar**

Run: `node -e "const f=require('fs');['C:/Users/jdiaz483/.claude/hooks/agy-work-guard.js','C:/Users/jdiaz483/.claude/skills/model-router/SKILL.md','C:/Users/jdiaz483/.claude/settings.json'].forEach(p=>console.log(f.existsSync(p)?'OK '+p:'FALTA '+p))"`
Expected: 3 líneas `OK`.

- [ ] **Step 3: Checklist manual para el usuario (requiere reiniciar Claude Code)**

Indicar al usuario:
1. Reiniciar la sesion de Claude Code para que cargue skill + hook.
2. En un proyecto de trabajo (ej: `Documents\work\ixc-omni-pat-portal`), pedir algo que intente correr `agy` → debe **bloquearse** con el mensaje del hook.
3. En `Documents\work\my-proyects\pixelforge`, pedir una tarea de desarrollo → la skill debe **proponer un modelo y esperar aprobacion**.

---

## Self-Review

**Spec coverage:**
- Decisión #1 (propuesta-y-aprobación) → SKILL.md §2. ✓
- Decisión #2 (equilibrado) → SKILL.md §3. ✓
- Decisión #3 (frontera) → hook `decide()` Task 1 + SKILL.md §1. ✓
- Decisión #4 (hook duro) → Task 1 + Task 2. ✓
- Decisión #5 (verificación sobre artefacto real) → SKILL.md §5. ✓
- Insight agy Opus/Sonnet 4.6 → matriz §3. ✓
- Límite autocontenido de agy → SKILL.md §4a. ✓
- Manejo de errores (§9 spec) → SKILL.md §7. ✓
- GPT-OSS excluido → SKILL.md §3. ✓
- Máx 2 reintentos → SKILL.md §5. ✓

**Placeholder scan:** sin TBD/TODO; todo el código y el contenido de SKILL.md está completo. ✓

**Type consistency:** `decide({command, cwd, home})` con el mismo shape en test (Task 1 Step 1), implementación (Step 3) y export. La salida de decisión del entrypoint (`hookSpecificOutput.permissionDecision`) coincide con el formato de hook `PreToolUse`. ✓

**Nota:** los 3 archivos viven en `~/.claude` (fuera de repos). No hay commits salvo pedido explícito del usuario.
