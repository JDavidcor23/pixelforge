# Changesets

This directory tracks version changes for `packages/*` only (currently
`@pixelforge/tokens`). The two apps (`apps/landing`, `apps/editor`) are
ignored — they deploy straight from `master`, they don't publish a package,
and a changelog/semver number doesn't mean anything for them. `packages/*`
start at 0.x (no stability guarantee yet) — see
`openspec/changes/migrate-to-rust-core/design.md`'s "D10" and `docs/adr/0005-monorepo-split.md`.

Run `pnpm changeset` to add a changeset when you change a `packages/*` file
that other code depends on; `pnpm changeset version` bumps versions and
writes `CHANGELOG.md` entries before a release.
