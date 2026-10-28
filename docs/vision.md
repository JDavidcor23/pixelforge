# PixelForge IA — Vision and milestones

Source of truth for where the product is going and what milestone 1 is.
Captured on 2026-10-24 from the owner's own words (quoted verbatim in Spanish
below). Start the next feature from here with `/superpowers:brainstorming`.

## Why this exists (the owner's pain)

- Making games is hard, and the owner loves games and telling stories through
  fun things.
- Kids should create and use their imagination instead of only consuming
  content on a tablet.
- A large, well-architected project to show in job interviews.

> "Quizás es un dolor que tenga porque me gusta contar historias a través de
> cosas divertidas."

## Long-term vision

A professional game-creation platform where AI collaborates but is not the
main focus. The focus is a solid base so anyone can build a polished game that
feels close to AA quality for its genre.

> "La plataforma tiene que ser una plataforma profesional de creación de
> videojuegos con colaboración con inteligencia artificial. Sí, la
> inteligencia artificial ayuda, pero no es el principal foco. El principal
> foco es construir videojuegos con una base sólida para que las personas
> puedan hacer un videojuego que pueda ser más o menos un AA."

> "Si el usuario va a crear un videojuego al estilo Mario Bros. Tiene que estar
> absolutamente pulido en el sentido de la programación, que se sienta fluido.
> Con una integración con los assets muy bien hecha para que los dos campos se
> comuniquen bien y se pueda tener un resultado semiprofesional que chicos van
> a poder compartir."

Future layers the owner named (not in milestone 1):

1. More genres beyond platformers.
2. Cinematics (animated story scenes).
3. Asset marketplace.
4. A well-structured harness between AI agents and game creation.
5. AWS integration to publish and maintain each game on the web (Steam and
   other stores are possible but not the goal).
6. A free-games portal where people play every game and support it with likes.
7. Schools: a teacher builds a game, for example about Simón Bolívar.

## North-star use case

> "Oye, necesito leer la biografía de Simón Bolívar. Y me da pereza. Hago una
> especie de orquestador de agentes para que cree un juego plataformero de
> Simón Bolívar con cinemáticas y todo eso. Sería épico."

## Milestone 1 — From a text to a playable platformer

The owner's first draft of milestone 1:

> "El primero sería ya un flujo completo. O sea, un chat donde le diga que lea
> todos los assets y de ahí pase a la construcción del videojuego con buenas
> prácticas de desarrollo, con optimización profunda para el tipo de juego que
> se está creando."

Scoped down (agreed direction, refine in brainstorming):

- **Input:** a text (for example Simón Bolívar's biography) plus the project's
  assets.
- **Output:** a playable platformer that tells that story.
- **One genre only:** platformer. The movement must feel fluid; that is the
  quality bar, not AA scope.
- **Story:** the text becomes 5–6 key moments; each moment becomes a level.
- **Story between levels:** a static story card (text plus an existing
  sprite). No generated animation.
- **Done when:** the real users play the Simón Bolívar game and learn
  something about him without noticing.
- **Out of scope:** cinematics (the owner does not know yet how to generate
  them; Retro Diffusion may not support it — research later), other genres,
  marketplace, AWS publishing, portal, schools.

### The plan (Freddy's format)

Every plan needs: an ambitious, clear and achievable goal; a deadline; one
single success metric; a list of what can go wrong; and what to do if it does.

- **Goal:** by 2026-12-20, two real users play, start to finish, a
  Simón Bolívar platformer that PixelForge built from his biography.
- **Deadline:** 2026-12-20 (8 weeks, starting 2026-10-26). Dates confirmed
  by the owner on 2026-10-24.
- **Single success metric:** after playing, each real user answers at least 3 of
  5 simple questions about Bolívar correctly, without being taught beforehand.

Tasks live in GitHub (so Orca can link them to worktrees):
https://github.com/JDavidcor23/pixelforge/milestones — M1 holds issues #18–#20, #22–#28, #31 and #32;
M2–M8 are undated milestones. The plan itself is mirrored in the owner's
personal Notion page "PixelForge IA — Roadmap".

| Phase | What ships (always playable) | Weeks | Dates |
| --- | --- | --- | --- |
| 1a | Phaser wired in; one hand-made level with our own sprites; fluid run and jump | 2 | 2026-10-26 → 2026-11-08 |
| 1b | The same level loaded from a JSON file (a level is data, not code) | 1 | 2026-11-09 → 2026-11-15 |
| 1c | AI reads a text, picks key moments, and writes one level JSON per moment | 2 | 2026-11-16 → 2026-11-29 |
| 1d | 5–6 levels chained, with a story card between levels | 2 | 2026-11-30 → 2026-12-13 |
| 1e | Buffer, polish, and the test with real users | 1 | 2026-12-14 → 2026-12-20 |

**What can go wrong, and what to do:**

| Risk | If it happens |
| --- | --- |
| Movement does not feel fluid | Use proven platformer tricks (coyote time, jump buffer, variable jump height). Keep 1a time-boxed; polish continues in parallel. |
| The AI writes unplayable levels (impossible gaps, no exit) | Validate each JSON with a schema and a "can the player reach the exit" check. Fallback: the AI only picks and fills hand-made level templates. |
| Generated assets look inconsistent | Reuse sprites already made in the editor; one character plus one tileset; generate only what is missing. |
| Not enough time (full-time job, other features pull) | Freeze unrelated features until 2026-12-20. If a phase runs more than one week late, cut levels from 6 to 3. |
| The real users get bored or find it too hard | Let them play at the end of 1a, not only at the end. Keep the difficulty low. |
| AI API costs grow | Set a spending cap per generation run; cache results. |

## Method (from the Serudda video, 2026-10-24)

Solve your own problem, split it into milestones, then spec → plan →
subagent-driven implementation. Answer the agent's questions as the end user,
check results in the browser, and remember that a clean base with no real
feature is still "an empty house".
