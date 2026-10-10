/**
 * Phase 7f CRITICAL #1 + #2, end-to-end at the STORE level, against the REAL
 * built `.wasm` (not a fake) — the two things the orchestrator's fix list
 * called out explicitly:
 *
 *  1. "the flag is dead": with `pf:core`/`VITE_PIXEL_CORE` resolved to
 *     `'wasm'` and the startup gate (`waitForWasmModule`) awaited exactly
 *     the way `services/document-persistence.controller.ts` now does it,
 *     the store's lazily-bootstrapped `core` (`stores/slices/core.slice.ts`)
 *     must actually construct a `WasmPixelCore`, not silently stay on
 *     `TsPixelCore`.
 *  2. A REAL trap (`WasmPixelCore.debugForceTrap()` — a genuine
 *     `WebAssembly.RuntimeError` the first time, then a plain "recursive use
 *     of an object" `Error` on every call after, exactly like a genuine OOM
 *     would leave the instance) must: lose only the one failing command,
 *     preserve every pixel dispatched before it, drop undo history, request
 *     an immediate autosave flush, and leave the store dispatching
 *     successfully on TS afterward.
 *
 * `loadWasmModule` is the only part of `@pixelforge/core` mocked — it's
 * replaced with a Node-`initSync` loader of the REAL committed `pkg/`
 * (same technique `wasm-pixel-core.differential.fuzz.test.ts` uses), never a
 * fake WasmPixelCore. Skips gracefully if `pkg/` hasn't been built.
 */
import { existsSync, readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath, pathToFileURL } from 'node:url'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

const here = dirname(fileURLToPath(import.meta.url))
const pkgDir = join(here, '..', '..', '..', '..', '..', 'packages', 'core', 'pkg')
const wasmPath = join(pkgDir, 'pixelforge_core_bg.wasm')
const wasmJsPath = join(pkgDir, 'pixelforge_core.js')
const pkgAvailable = existsSync(wasmPath)

if (!pkgAvailable) {
  console.warn(`[core.slice.real-trap] ${wasmPath} not found — run "pnpm run build:wasm" in packages/core first. Skipping this suite.`)
}

const instances: Array<{ debugForceTrap: () => void }> = []

vi.mock('@/config/env', () => ({
  getPixelCoreEnvOverride: () => 'wasm',
}))

vi.mock('@pixelforge/core', async (importOriginal) => {
  const real = await importOriginal<typeof import('@pixelforge/core')>()
  if (!pkgAvailable) return real
  const mod = await import(pathToFileURL(wasmJsPath).href)
  mod.initSync({ module: readFileSync(wasmPath) })
  class ProbeWasmPixelCore extends real.WasmPixelCore {
    constructor(...args: ConstructorParameters<typeof real.WasmPixelCore>) {
      super(...args)
      instances.push(this as unknown as { debugForceTrap: () => void })
    }
  }
  return { ...real, WasmPixelCore: ProbeWasmPixelCore, loadWasmModule: async () => mod }
})

describe.runIf(pkgAvailable)('core.slice.ts — real Wasm core, real trap (phase 7f)', () => {
  beforeEach(() => {
    instances.length = 0
    vi.resetModules()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('"wasm" + awaited startup gate: the store actually constructs and uses a WasmPixelCore', async () => {
    const { waitForWasmModule, resetWasmPixelCoreResolverForTests } = await import('@/lib/core/wasm-pixel-core-resolver')
    resetWasmPixelCoreResolverForTests()
    // Mirrors `document-persistence.controller.ts`'s startup gate exactly —
    // this is what makes the flag non-dead (CRITICAL #1).
    await waitForWasmModule()

    const { useSpriteEditorStore } = await import('@/stores')
    const { timelineToDocumentPayload } = await import('@/lib/core/test-helpers')
    const { createEmptyBuffer } = await import('@/lib')

    const payload = timelineToDocumentPayload(
      {
        frames: [{ id: 'F0', layers: [{ id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels: createEmptyBuffer(4, 4) }], activeLayerId: 'L0', durationMs: 83 }],
        currentFrameIndex: 0,
        isPlaying: false,
        fps: 12,
        loop: true,
        selectedFrameIndices: [0],
      },
      4,
      4
    )
    useSpriteEditorStore.getState().importDocument(payload)

    expect(instances.length).toBeGreaterThan(0) // a REAL WasmPixelCore was constructed — the flag actually took effect
  })

  it('a real trap mid-session: the failing command is lost, everything before it survives, undo history drops, autosave flushes immediately, and TS takes over', async () => {
    const { waitForWasmModule, resetWasmPixelCoreResolverForTests } = await import('@/lib/core/wasm-pixel-core-resolver')
    const { resetDocumentPersistenceFlushBusForTests, registerDocumentPersistenceFlush } = await import('@/services/document-persistence-flush-bus.service')
    resetWasmPixelCoreResolverForTests()
    resetDocumentPersistenceFlushBusForTests()
    await waitForWasmModule()

    const flushSpy = vi.fn()
    registerDocumentPersistenceFlush(flushSpy)

    const { useSpriteEditorStore } = await import('@/stores')
    const { timelineToDocumentPayload } = await import('@/lib/core/test-helpers')
    const { createEmptyBuffer } = await import('@/lib')

    const buffer = createEmptyBuffer(4, 4)
    const payload = timelineToDocumentPayload(
      {
        frames: [{ id: 'F0', layers: [{ id: 'L0', name: 'a', visible: true, locked: false, opacity: 100, pixels: buffer }], activeLayerId: 'L0', durationMs: 83 }],
        currentFrameIndex: 0,
        isPlaying: false,
        fps: 12,
        loop: true,
        selectedFrameIndices: [0],
      },
      4,
      4
    )
    useSpriteEditorStore.getState().importDocument(payload)
    expect(instances.length).toBe(1)

    // Dispatch something real BEFORE the trap — a recognizable, fully
    // committed pixel edit that must survive the trap.
    const layerId = useSpriteEditorStore.getState().activeLayerId
    useSpriteEditorStore.getState().dispatch({ type: 'stroke.begin', layerId })
    useSpriteEditorStore.getState().dispatch({ type: 'stroke.points', points: Int32Array.from([0, 0]), rgba: 0xff0000ff })
    useSpriteEditorStore.getState().dispatch({ type: 'stroke.end', label: 'Draw' })

    const beforeTrapPixels = Array.from(useSpriteEditorStore.getState().layers[0].pixels.data)
    expect(beforeTrapPixels.slice(0, 4)).toEqual([255, 0, 0, 255]) // the pixel really landed
    const canUndoBeforeTrap = useSpriteEditorStore.getState().canUndo
    expect(canUndoBeforeTrap).toBe(true)

    // REAL trap: a genuine WebAssembly panic -> `unreachable` trap on the
    // EXACT instance the store is using (not a fake).
    const vi_errorSpy = vi.spyOn(console, 'error').mockImplementation(() => undefined)
    expect(() => instances[0].debugForceTrap()).toThrow()

    // The NEXT store dispatch hits the now-poisoned Wasm instance (stuck
    // borrow flag -> plain Error, not another RuntimeError) — `core.slice.ts`
    // must catch it, recover, and NOT crash the caller.
    let thrown: unknown = null
    try {
      useSpriteEditorStore.getState().dispatch({ type: 'frame.add' })
    } catch (e) {
      thrown = e
    }
    expect(thrown).toBeNull() // graceful degrade — no ErrorBoundary exists in this app, so this must not throw out of the store action

    // No data loss: the pre-trap pixel content is still exactly there.
    const afterTrapPixels = Array.from(useSpriteEditorStore.getState().layers[0].pixels.data)
    expect(afterTrapPixels.slice(0, 4)).toEqual([255, 0, 0, 255])

    // Undo history was dropped (documented tradeoff — the recovered core
    // has no history of its own).
    expect(useSpriteEditorStore.getState().canUndo).toBe(false)

    // Autosave flushed immediately, not just scheduled on the debounce.
    expect(flushSpy).toHaveBeenCalled()

    // Subsequent dispatches now run on TS successfully.
    const result = useSpriteEditorStore.getState().dispatch({ type: 'frame.add' })
    expect(result.changed).toBe(true)
    expect(useSpriteEditorStore.getState().timeline.frames.length).toBe(2)

    vi_errorSpy.mockRestore()
  })
})
