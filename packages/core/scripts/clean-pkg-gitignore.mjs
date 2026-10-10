// Gotcha (design.md "Migration / Rollout"): `wasm-pack build` writes a
// `pkg/.gitignore` containing a bare `*`, which would make the committed
// `pkg/` output silently empty (every file in it ignored). This runs as the
// LAST step of `build:wasm` itself, not a manual step someone can forget.
import { existsSync, unlinkSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const here = dirname(fileURLToPath(import.meta.url))
const gitignorePath = join(here, '..', 'pkg', '.gitignore')

if (existsSync(gitignorePath)) {
  unlinkSync(gitignorePath)
  console.log('[build:wasm] removed pkg/.gitignore (wasm-pack writes one containing "*" — would silently empty the committed pkg/)')
} else {
  console.log('[build:wasm] pkg/.gitignore not present — nothing to remove')
}
