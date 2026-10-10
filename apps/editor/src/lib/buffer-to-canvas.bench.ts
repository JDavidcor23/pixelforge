import { bench, describe } from 'vitest'
import { renderPixelsToCanvas } from './buffer-to-canvas'
import { createEmptyBuffer, putPixel } from './pixel-buffer'

// Phase 2 cleanup (carry-over item C) — retargets the repaint bench from the
// now-deleted dead code chain (`canvas-renderer.ts`'s `renderPixelGrid` ->
// `useCanvasRenderer.hook.ts` -> `useCanvasArea.hook.ts`, confirmed unused via
// `rg`) to the LIVE render path: `renderPixelsToCanvas` from
// `buffer-to-canvas.ts`, which both the Konva `SpriteLayers.tsx` and
// `SelectionOverlay.tsx` actually call. Comparable reference point for
// pixel-core "Full Canvas Repaint Performance" (<4ms) — one call per visible
// layer per repaint, same cost center the old bench measured.
// Run with: pnpm run bench

const SIZE = 256

function makeFullBuffer() {
  const pixels = createEmptyBuffer(SIZE, SIZE)
  for (let y = 0; y < SIZE; y++) {
    for (let x = 0; x < SIZE; x++) {
      putPixel(pixels, x, y, { r: x % 256, g: y % 256, b: (x + y) % 256, a: 255 })
    }
  }
  return pixels
}

// There is no real DOM in the `node` test environment. `renderPixelsToCanvas`
// calls `document.createElement('canvas')` and `new ImageData(...)`; both are
// stubbed here with minimal no-op stand-ins so the bench isolates the JS-side
// cost of this implementation (buffer copy + offscreen canvas creation), not
// real browser paint time — same approach the deleted bench used.
function installFakeDom(): void {
  class FakeImageData {
    data: Uint8ClampedArray
    width: number
    height: number
    constructor(data: Uint8ClampedArray, width: number, height: number) {
      this.data = data
      this.width = width
      this.height = height
    }
  }

  function makeFakeCanvasContext() {
    return {
      imageSmoothingEnabled: false,
      putImageData: () => {},
      drawImage: () => {},
      getContext: () => null,
    }
  }

  function makeFakeCanvas() {
    let width = 0
    let height = 0
    const ctx = makeFakeCanvasContext()
    return {
      get width() {
        return width
      },
      set width(v: number) {
        width = v
      },
      get height() {
        return height
      },
      set height(v: number) {
        height = v
      },
      getContext: () => ctx,
    }
  }

  ;(globalThis as unknown as { ImageData: unknown }).ImageData = FakeImageData
  ;(globalThis as unknown as { document: unknown }).document = {
    createElement: (tag: string) => (tag === 'canvas' ? makeFakeCanvas() : null),
  }
}

installFakeDom()

describe('full canvas repaint — 256x256, 1 fully-opaque layer', () => {
  const buffer = makeFullBuffer()

  bench('renderPixelsToCanvas — phase 2 (TS, putImageData via offscreen canvas)', () => {
    renderPixelsToCanvas(buffer)
  })
})
