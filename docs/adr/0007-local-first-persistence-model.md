# 0007 — Local-first persistence model

**Status**: Accepted (phase 1, **D12**)

## Context

PixelForge needed a persistence story before any cloud sync feature existed.
Building Supabase sync first means solving auth, conflict resolution, and
offline handling all before a user can reliably keep a single local draft —
a large amount of upfront complexity for a problem (multi-device sync) most
users don't have on day one.

## Decision

**Local-first**: IndexedDB (via the `DocumentRepository` port, ADR 0006) is
the working-draft store, full stop, for this change. Cloud project sync is
explicitly **out of scope** here and deferred to a future, separate change
(tracked as `supabase-project-sync`), which adds a Supabase adapter *behind
the same port* — `revision`/`updatedAt` already exist on `StoredDocument`
specifically so that future change has the conflict-detection inputs it will
need, without this change having to build the resolution logic itself.

## Consequences

- Users get working persistence (survive a reload, a crash, a closed tab)
  immediately, with no auth dependency and no network requirement.
- A single draft id (`LOCAL_DRAFT_DOCUMENT_ID`) is sufficient for phase 1 —
  multi-document/multi-project support is a separate, later concern.
- The editor's Supabase client (`apps/editor/src/lib/supabase.ts`) exists
  today only for auth/storage features unrelated to document persistence
  (e.g. the sound library) — it is not yet in the document-save path, by
  design, until `supabase-project-sync` lands.
