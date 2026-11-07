/**
 * ADR 0015: a tiny module-scope bridge from the UI (Assets tile, File > New
 * sprite, `/sprites?asset=<id>`) to the ACTIVE `DocumentPersistenceController`
 * owned by `useDocumentPersistence.hook.ts`. Same pattern and reason as
 * `document-persistence-flush-bus.service.ts`: no store ↔ hook import cycle.
 *
 * Both requests are safe no-ops while no controller is registered (before
 * the first restore finishes, or after unmount).
 */
export interface DocumentAssetCommands {
  /** Flushes the current asset, then opens `id`. Resolves `false` when `id` has no document and no PNG to build one from. */
  readonly openAsset: (id: string) => Promise<boolean>
  /** Flushes the current asset, then starts a blank, not-yet-stored sprite. */
  readonly newSprite: () => void
}

let activeCommands: DocumentAssetCommands | null = null

/** Called by `useDocumentPersistence.hook.ts` once its controller is adopted, and with `null` on cleanup/unmount. */
export function registerDocumentAssetCommands(commands: DocumentAssetCommands | null): void {
  activeCommands = commands
}

export function requestOpenAsset(id: string): Promise<boolean> {
  return activeCommands ? activeCommands.openAsset(id) : Promise.resolve(false)
}

export function requestNewSprite(): void {
  activeCommands?.newSprite()
}

/** Test-only: forgets the registered commands between test cases. */
export function resetDocumentAssetBusForTests(): void {
  activeCommands = null
}
