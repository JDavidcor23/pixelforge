# Guía de herramientas de diseño (impeccable + skills de Emil Kowalski + Pencil)

Guía práctica para saber qué instalaste, dónde actúa cada cosa y cómo usarla.

## Resumen en 30 segundos

| Herramienta | Dónde actúa | Para qué |
| --- | --- | --- |
| **Pencil** (`design.pen`) | Canvas de diseño | Diseñar y comparar pantallas ANTES de tocar código |
| **impeccable** (skill) | Código y planificación | Dirección de diseño, críticas, auditorías, pulido de UI |
| **Hook de impeccable** | Código (automático) | Revisa cada archivo de UI que se edita y avisa de problemas |
| **Skills de Emil Kowalski** | Código | Animaciones, micro-detalles, casos extremos |

Regla clave: **el hook y las skills trabajan sobre código, no sobre Pencil.**
Pencil se usa para decidir el diseño; luego se implementa en código y ahí
impeccable y su hook validan el resultado.

## Flujo recomendado

1. **Diseñar en Pencil**: termina tu frame en `design.pen`, con la app abierta.
2. **Un solo comando**:

   ```
   /implementar "Sound Editor · C · Library"
   ```

   Lee el frame, lo implementa con los agentes del proyecto, lo revisa con impeccable,
   agrega animaciones útiles, prueba casos extremos y te da un resumen corto.
   El comando está en `.claude/commands/implementar.md` y lo puedes editar.

Todo lo de abajo es referencia: no necesitas usarlo a mano.

## impeccable

Instalada en `.claude/skills/impeccable/` (y una copia para GitHub Copilot en `.github/skills/`).

Archivos de contexto que usa:

- `PRODUCT.md` — para quién es el producto y qué problema resuelve (ya creado).
- `DESIGN.md` — el sistema visual (colores, tipografía, espaciado). Ya existía.

Comandos más útiles (se escriben en el chat):

| Comando | Cuándo usarlo |
| --- | --- |
| `/impeccable critique <pantalla>` | "¿Qué tiene de malo esta pantalla?" Revisión UX con puntaje |
| `/impeccable audit <pantalla>` | Accesibilidad, rendimiento, responsive |
| `/impeccable polish <pantalla>` | Pasada final antes de publicar |
| `/impeccable distill <pantalla>` | Está demasiado cargada; simplificar |
| `/impeccable clarify <pantalla>` | Mejorar textos, etiquetas y mensajes de error |
| `/impeccable onboard <pantalla>` | Estados vacíos y primera experiencia |
| `/impeccable layout <pantalla>` | Espaciado, ritmo, jerarquía |
| `/impeccable shape <feature>` | Planear una feature nueva antes de escribir código |
| `/impeccable` (sin nada) | Muestra un menú según el estado del proyecto |

### El hook (lo que instaló en `.claude/settings.local.json`)

Corre solo en tres momentos:

- **Al iniciar sesión** — prepara el contexto.
- **Después de cada Edit/Write** sobre archivos de UI (`.tsx`, `.css`, etc.) — revisa
  problemas obvios: contraste bajo, texto desbordado, texto con gradiente, sombras
  "glow", valores fuera del sistema de diseño.
- **Al terminar la respuesta (Stop)** — una revisión más profunda de todos los
  archivos tocados en la sesión.

No hace nada en Pencil. Comandos para gestionarlo:

```
/impeccable hooks status   # ver estado
/impeccable hooks off      # apagarlo en este proyecto
/impeccable hooks on       # encenderlo
```

`.github/hooks/impeccable.json` es el mismo hook pero para GitHub Copilot; Claude Code no lo usa.

### Agentes que instaló (`.claude/agents/impeccable-*.md`)

Los usa impeccable internamente; normalmente no los llamas tú:

- `impeccable-finish-reviewer` — revisa una construcción terminada contra la dirección elegida.
- `impeccable-documenter` — actualiza `DESIGN.md` a partir de lo construido.
- `impeccable-asset-producer` — produce imágenes/assets a partir de una maqueta aprobada.
- `impeccable-manual-edit-applier` — aplica ediciones de texto hechas en el modo "live".

## Skills de Emil Kowalski

Instaladas globalmente en `~/.claude/skills/` (sirven en todos tus proyectos).
Emil Kowalski es el diseñador detrás de Sonner y Vaul; sus skills se enfocan en
movimiento y en los detalles que hacen que una interfaz "se sienta bien".

| Skill | Cómo pedirlo | Qué hace |
| --- | --- | --- |
| `emil-design-eng` | "revisa el pulido de este componente" | Criterio general de pulido y detalles invisibles |
| `animate` | "anima la apertura de este panel" | Construye una animación desde cero, decidiendo curva y duración |
| `find-animation-opportunities` | "¿qué debería animarse aquí?" | Propone dónde sí (y dónde no) poner movimiento. No edita |
| `improve-animations` | "audita las animaciones del editor" | Auditoría priorizada del movimiento existente. No edita |
| `review-animations` | `/review-animations` (solo manual) | Revisión estricta de un diff con animaciones |
| `animation-vocabulary` | "¿cómo se llama el efecto de...?" | Diccionario de nombres de efectos |
| `break-ui` | "rompe este componente con datos extremos" | Prueba nombres largos, listas vacías, números enormes |
| `apple-design` | "haz que el arrastre se sienta como iOS" | Gestos, resortes, física al estilo Apple |
| `prototype` | `/prototype` (solo manual) | Varias versiones de un componente con selector en vivo |
| `pick-ui-library` | `/pick-ui-library` (solo manual) | Recomienda librería para una tarea (toasts, charts, etc.) |

Las marcadas "solo manual" no se activan solas: hay que escribir el comando.

## Pencil

- Archivo: `design.pen` en la raíz. Ábrelo con la app de Pencil.
- Es un canvas: cada pantalla es un frame. Puedes mover, comentar y comparar.
- Para pedir cambios: "en Pencil, cambia X de la propuesta A".
- Cuando una propuesta esté aprobada, se implementa en código con los agentes del proyecto.

## Rediseño del editor de audio (estado actual)

Propuestas en `design.pen`, todas dentro del sistema visual de `DESIGN.md`
(cian = acción, violeta = solo IA):

- **A · Takes** — escribes qué sonido quieres (o eliges una idea: Salto, Moneda...),
  se generan 4 versiones, escuchas, te quedas con una y la ajustas con controles
  en palabras simples (Pitch, Length, Punch, Tone, cada uno con extremos tipo
  "Deeper / Higher").
- **B · Guiado** — tres pasos: elegir punto de partida → darle forma → guardar.
  Ajustes rápidos con botones ("Higher", "Shorter", "Surprise me").
- **C · Biblioteca** — tus sonidos a la izquierda; el seleccionado se edita al centro.
  "Nuevo sonido" abre un menú con presets, IA o importar archivo.

Decisiones comunes a las tres:

- La API key de ElevenLabs ya no aparece en el editor de audio. Vive solo en Settings.
  Si falta, se muestra un aviso con enlace a Settings.
- Los parámetros técnicos (oscilador, ADSR, filtro) quedan detrás de "Avanzado".
- Síntesis e IA son dos caminos iguales hacia el mismo resultado.
