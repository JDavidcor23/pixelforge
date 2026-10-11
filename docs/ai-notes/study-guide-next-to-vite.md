> AI-generated source notes. Study guide for the owner, not the owner's writing.
> The owner's article lives on his website.

# Guía de estudio: separar el editor de Next.js a Vite

Objetivo: entender lo que se hizo para escribir tu artículo con tus palabras.
Lee de arriba hacia abajo. Cada concepto tiene una explicación simple y **un solo
enlace** para leer. Tiempo total estimado: unas 2 horas.

---

## Parte 1 — Qué se hizo (la historia completa, en simple)

**Antes.** PixelForge era **una sola app de Next.js**. Esa app tenía dos partes
muy distintas:

- **La landing** (la página de presentación del producto): texto, imágenes,
  botones. La tiene que encontrar Google y debe cargar rápido la primera vez.
- **El editor** (donde dibujas sprites y editas sonidos): un canvas, herramientas,
  atajos de teclado. Todo pasa en el navegador del usuario. No hay nada que
  Google tenga que leer adentro.

**El problema.** Next.js es muy bueno haciendo trabajo **en el servidor**:
prepara el HTML antes de enviarlo, lo que ayuda a Google (SEO) y a que la
primera pantalla aparezca rápido. La landing aprovecha eso. **El editor no**:
el canvas solo funciona en el navegador, así que todo ese trabajo de servidor no
le servía de nada, pero igual tenía que convivir con las reglas de Next
(componentes de servidor y de cliente, `'use client'`, etc.).

**La decisión.** Separar el proyecto en un **monorepo** con pnpm:

```text
apps/landing     → se queda en Next.js 16 (aquí Next brilla: SEO, carga inicial)
apps/editor      → pasa a Vite + React (una SPA: todo en el navegador)
packages/tokens  → colores y estilos compartidos por las dos apps
packages/core    → el motor de píxeles (Rust → WebAssembly), en su propio paquete
```

**Importante para tu artículo:** no dejaste Next. **Lo usaste donde tiene
sentido** y sacaste solo la parte que no lo necesitaba.

**Cómo se despliega.** Son dos proyectos de Vercel, uno por app. Cada uno solo
se vuelve a desplegar si cambió su propio código (Vercel "Ignored Build Step").

**Qué se ganó**
- El editor ya no carga con reglas de servidor que no usa.
- Cada app se despliega por separado.
- El motor en Rust vive en su propio paquete, con su propio build y sus tests.

**Qué se perdió (dilo en el artículo, da credibilidad)**
- En el editor ya no hay `next/image` ni `next/font` (optimización automática de
  imágenes y fuentes). Ahora se usa `<img>` normal y la fuente con un `<link>`.
- Hubo que reescribir la navegación del editor con `react-router-dom`.
- Ahora hay **dos stacks con reglas distintas** (por ejemplo, las variables de
  entorno se llaman `NEXT_PUBLIC_*` en una y `VITE_*` en la otra).

**Las claves de la IA (ElevenLabs, Retro Diffusion).** Las llamadas a la IA
pasan por **Vercel Functions** (pequeñas funciones de servidor) para que la
clave del servidor nunca llegue al navegador.

**Lo que se midió**
- El editor en Vite arranca en desarrollo en **337–663 ms** (meta: menos de 2 s).
  Fuente: `openspec/changes/migrate-to-rust-core/baseline-bench.md`, Fase 3.

**Lo que NO se midió (no lo afirmes)**
- Que la página cargue más rápido en producción.
- El tamaño final del bundle.

---

## Parte 2 — Conceptos que tienes que entender (en este orden)

### 1. SSR vs CSR (dónde se arma la página)
- **SSR (Server-Side Rendering):** el servidor arma el HTML y lo manda listo.
  Bueno para SEO y para que la primera pantalla aparezca rápido.
- **CSR (Client-Side Rendering):** el navegador recibe JavaScript y arma la
  página él mismo. Bueno para apps muy interactivas.
- **Leer:** "Rendering on the Web" — https://web.dev/articles/rendering-on-the-web
  (el artículo clave de todo este tema; lee hasta "Static rendering").

### 2. SPA (Single Page Application)
- Una app que carga una vez y luego cambia de pantalla sin recargar. Tu editor
  es una SPA.
- **Leer:** https://developer.mozilla.org/en-US/docs/Glossary/SPA (2 minutos).

### 3. React Server Components y `'use client'`
- En Next moderno, los componentes corren **en el servidor por defecto**. Si
  necesitan el navegador (canvas, eventos, `useState`), llevan `'use client'`.
  Un editor que es todo canvas termina con `'use client'` en todas partes: es la
  señal de que no necesitaba el servidor.
- **Leer:** https://nextjs.org/docs/app/getting-started/server-and-client-components

### 4. Qué es Vite
- Una herramienta que sirve y empaqueta apps de frontend. Arranca muy rápido en
  desarrollo y no trae servidor de render: perfecta para una SPA.
- **Leer:** en vite.dev, la sección "Guide → Why Vite".

### 5. Monorepo con pnpm workspaces
- Un solo repositorio con varios proyectos que comparten código (tus tokens de
  diseño) pero se construyen y despliegan por separado.
- **Leer:** https://pnpm.io/workspaces

### 6. Monorepos en Vercel
- Cada app es un proyecto de Vercel con su "Root Directory". El "Ignored Build
  Step" evita redesplegar si esa app no cambió.
- **Leer:** https://vercel.com/docs/monorepos

### 7. Vercel Functions (por qué las claves no van en el navegador)
- Todo lo que empieza con `VITE_` o `NEXT_PUBLIC_` termina **dentro del
  JavaScript del navegador**: cualquiera lo puede ver. Las claves secretas van
  en una función de servidor que hace de intermediario.
- **Leer:** https://vercel.com/docs/functions

---

## Parte 3 — Preguntas para responderte antes de escribir

Responderlas con tus palabras es lo que hace que el artículo sea tuyo:

1. ¿Qué te hizo pensar en migrar? (el hype, lo que viste en LinkedIn)
2. ¿Qué parte de tu app **no** usaba lo que ofrece Next? ¿Cómo te diste cuenta?
3. ¿Por qué la landing se quedó en Next?
4. ¿Qué perdiste y qué te costó?
5. Si un amigo te pregunta "¿entonces Next es malo?", ¿qué le respondes?
6. ¿Qué aprendiste que no sabías antes de empezar?

---

## Parte 4 — Fuentes dentro del repo (si quieres profundizar)

| Tema | Archivo |
|---|---|
| Decisión del monorepo y del editor en Vite | `docs/adr/0005-monorepo-split.md` |
| Mediciones | `openspec/changes/migrate-to-rust-core/baseline-bench.md` |
| Reglas de cada app | `AGENTS.md` (sección "Stack") |
