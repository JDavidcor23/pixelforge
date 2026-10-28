# Build screen architecture — study notes

AI-generated source notes. Decision: ADR 0014. Read whenever you want; no rush.

## The four decisions in one line each

1. The game screen is a third room next to sprites and sounds (one game per user).
2. The game runs on its own and talks to the chat with messages, so the chat never redraws 60 times a second.
3. Every asset exists once, with a fixed ID and a version number. The chat, the library and the game only keep the ID.
4. "Edit" opens the existing editor with that asset, through the page address.

## Words to use in an interview

- **Route-based code splitting**: a screen's code downloads only when you open it.
- **Event bus**: two parts of an app talk by sending messages, not by sharing live state.
- **Entity with a stable identifier**: a thing is the same thing even when its data changes.
- **Normalized state**: store each record once, point to it by ID everywhere else.
- **Revision number**: a counter that goes up on every edit, so copies know they are old.
- **Observer pattern (publish/subscribe)**: whoever shows a record subscribes to it and gets told when it changes.
- **Content addressing**: identity = hash of the content. Good for frozen versions (Git), not for things you edit.
- **Deep linking**: the URL says exactly what to open, so reload and Back work.

Interview sentence: "A normalized asset catalog: assets are entities with
stable IDs and revision numbers, synced across views with the Observer
pattern, while the game loop stays outside React behind an event bus."

## Readings (short, in this order)

1. Entity vs Value Object — https://martinfowler.com/bliki/EvansClassification.html
2. Normalized state — https://redux.js.org/usage/structuring-reducers/normalizing-state-shape
3. Observer pattern (Spanish) — https://refactoring.guru/es/design-patterns/observer
4. Content addressing in Git — https://git-scm.com/book/en/v2/Git-Internals-Git-Objects
5. Phaser + React template (EventBus) — https://github.com/phaserjs/template-react

## After shipping

Add the measured numbers from the ADR 0014 budget table here.
