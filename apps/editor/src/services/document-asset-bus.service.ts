/**
 * ADR 0015: a tiny module-scope bridge from the UI (Assets tile, File > New
 * sprite, `/sprites?asset=<id>`) to the ACTIVE `DocumentPersistenceController`
 * owned by `useDocumentPersistence.hook.ts`. Same pattern and reason as
 * `document-persistence-flush-bus.service.ts`: no store ↔ hook import cycle.
 *
 * Both requests are safe no-ops while no controller is registered (before
 * the first restore finishes, or after unmount).
 */
import type { DuplicateAssetRequest } from '@/types'

export interface DocumentAssetCommands {
  /** Flushes the current asset, then opens `id`. Resolves `false` when `id` has no document and no PNG to build one from. */
  readonly openAsset: (id: string) => Promise<boolean>
  /** Flushes the current asset, then starts a blank, not-yet-stored sprite. */
  readonly newSprite: () => void
  /** Flushes the open sprite, stores a copy under a new Assets item and opens the copy. Resolves `false` when nothing was duplicated. */
  readonly duplicateAsset: (request: DuplicateAssetRequest) => Promise<boolean>
}

let activeCommands: DocumentAssetCommands | null = null
let readinessWaiters: Array<() => void> = []

/** Called by `useDocumentPersistence.hook.ts` once its controller is adopted, and with `null` on cleanup/unmount. */
export function registerDocumentAssetCommands(commands: DocumentAssetCommands | null): void {
  activeCommands = commands
  if (!commands) return
  const waiters = readinessWaiters
  readinessWaiters = []
  waiters.forEach((resolve) => resolve())
}

/** Resolves once a controller has registered (immediately if one already has). Deep links use it so they do not hit the bus too early. */
export function waitForDocumentAssetCommands(): Promise<void> {
  if (activeCommands) return Promise.resolve()
  return new Promise((resolve) => {
    readinessWaiters.push(resolve)
  })
}

export function requestOpenAsset(id: string): Promise<boolean> {
  return activeCommands ? activeCommands.openAsset(id) : Promise.resolve(false)
}

export function requestDuplicateAsset(request: DuplicateAssetRequest): Promise<boolean> {
  return activeCommands ? activeCommands.duplicateAsset(request) : Promise.resolve(false)
}

export function requestNewSprite(): void {
  activeCommands?.newSprite()
}

/** Test-only: forgets the registered commands between test cases. */
export function resetDocumentAssetBusForTests(): void {
  activeCommands = null
  readinessWaiters = []
}
