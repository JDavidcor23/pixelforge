import { beforeAll, describe, expect, it, vi } from 'vitest'

/** Minimal in-memory `Storage` — `persist` only exposes its API when one exists. */
const createMemoryStorage = (): Storage => {
  const data = new Map<string, string>()
  return {
    get length() {
      return data.size
    },
    clear: () => data.clear(),
    getItem: (key) => data.get(key) ?? null,
    key: (index) => [...data.keys()][index] ?? null,
    removeItem: (key) => void data.delete(key),
    setItem: (key, value) => void data.set(key, value),
  }
}

describe('persisted store keys', () => {
  beforeAll(() => {
    // zustand's default storage reads `window.localStorage`; vitest runs in node.
    const storage = createMemoryStorage()
    vi.stubGlobal('localStorage', storage)
    vi.stubGlobal('window', { localStorage: storage })
    // The AI jobs store persists its pending Animate job to sessionStorage.
    vi.stubGlobal('sessionStorage', createMemoryStorage())
  })

  // Two `persist` stores on one localStorage key overwrite each other: every
  // document change rewrote `sprite-editor-prefs` with only the colors and
  // wiped the saved Retro Diffusion key, palette and view prefs.
  it('gives every persisted store its own localStorage key', async () => {
    const { useSpriteEditorStore } = await import('./index')
    const { useEditorPrefsStore } = await import('./prefs.store')
    const { useEditorUIStore } = await import('./ui.store')
    const { useAIJobsStore } = await import('./ai-jobs.store')
    const { useAnimationJobLedgerStore } = await import('./animation-job-ledger.store')

    const names = [
      useSpriteEditorStore,
      useEditorPrefsStore,
      useEditorUIStore,
      useAIJobsStore,
      useAnimationJobLedgerStore,
    ].map(
      (store) => store.persist.getOptions().name,
    )
    expect(new Set(names).size).toBe(names.length)
  })
})
