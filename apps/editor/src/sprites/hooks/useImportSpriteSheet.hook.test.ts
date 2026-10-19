import { describe, expect, it, vi } from 'vitest'

import {
  nameFromFileName,
  openSpriteSheetFile,
  runSpriteSheetImport,
  suggestFrameCount,
  validateSpriteSheetImport,
} from './useImportSpriteSheet.hook'
import { IMPORT_SPRITE_SHEET_ERRORS } from '@/constants/file-menu'
import { SPRITE_ANIMATION, SPRITE_IMPORT_MAX_FRAMES } from '@/constants'
import type { PixelBuffer, SpriteSheetImportDeps } from '@/types'

const buffer = (side: number): PixelBuffer => ({ w: side, h: side, data: new Uint8ClampedArray(side * side * 4) })

const makeDeps = (frames: PixelBuffer[]): SpriteSheetImportDeps => ({
  decodeSingle: vi.fn(async () => buffer(128)),
  decodeSheet: vi.fn(async () => frames),
  overwriteWithPixels: vi.fn(),
  importAnimationFrames: vi.fn(),
  addAnimation: vi.fn(),
  toDataUri: vi.fn((frame: PixelBuffer) => `data:image/png;base64,${frame.w}`),
  createId: () => 'anim-1',
  now: () => 1000,
})

describe('suggestFrameCount', () => {
  it('prefills width / height when the strip divides evenly (1536x128 -> 12)', () => {
    expect(suggestFrameCount(1536, 128)).toBe(12)
  })

  it('prefills 1 when the width does not divide evenly by the height', () => {
    expect(suggestFrameCount(1500, 128)).toBe(1)
  })

  it('prefills 1 when the even split exceeds the frame limit', () => {
    expect(suggestFrameCount(128 * (SPRITE_IMPORT_MAX_FRAMES + 1), 128)).toBe(1)
  })
})

describe('nameFromFileName', () => {
  it('drops the extension', () => {
    expect(nameFromFileName('hero-run.png')).toBe('hero-run')
  })
})

describe('validateSpriteSheetImport', () => {
  it('rejects a blank name', () => {
    expect(validateSpriteSheetImport({ name: '   ', frames: '12', width: 1536 })).toBe(
      IMPORT_SPRITE_SHEET_ERRORS.NAME_REQUIRED,
    )
  })

  it('rejects frames out of range or not an integer', () => {
    expect(validateSpriteSheetImport({ name: 'run', frames: '0', width: 1536 })).toBe(
      IMPORT_SPRITE_SHEET_ERRORS.FRAMES_OUT_OF_RANGE,
    )
    expect(validateSpriteSheetImport({ name: 'run', frames: String(SPRITE_IMPORT_MAX_FRAMES + 1), width: 1536 })).toBe(
      IMPORT_SPRITE_SHEET_ERRORS.FRAMES_OUT_OF_RANGE,
    )
    expect(validateSpriteSheetImport({ name: 'run', frames: '2.5', width: 1536 })).toBe(
      IMPORT_SPRITE_SHEET_ERRORS.FRAMES_OUT_OF_RANGE,
    )
    expect(validateSpriteSheetImport({ name: 'run', frames: '', width: 1536 })).toBe(
      IMPORT_SPRITE_SHEET_ERRORS.FRAMES_OUT_OF_RANGE,
    )
  })

  it('rejects a width that does not split into the frame count', () => {
    expect(validateSpriteSheetImport({ name: 'run', frames: '5', width: 1536 })).toBe(
      IMPORT_SPRITE_SHEET_ERRORS.WIDTH_NOT_DIVISIBLE,
    )
  })

  it('accepts a valid name and frame count', () => {
    expect(validateSpriteSheetImport({ name: 'run', frames: '12', width: 1536 })).toBeNull()
  })
})

describe('openSpriteSheetFile', () => {
  const file = new File([], 'hero-run.png')

  it('prefills Name from the file name and Frames from the image size', async () => {
    const opened = await openSpriteSheetFile(file, {
      readAsDataUrl: async () => 'data:sheet',
      measure: async () => ({ w: 1536, h: 128 }),
    })

    expect(opened).toEqual({
      ok: true,
      pending: { dataUrl: 'data:sheet', width: 1536, height: 128 },
      name: 'hero-run',
      frames: '12',
    })
  })

  it('returns a user-facing message when the file cannot be read', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const opened = await openSpriteSheetFile(file, {
      readAsDataUrl: async () => {
        throw new Error(IMPORT_SPRITE_SHEET_ERRORS.READ_FAILED)
      },
      measure: async () => ({ w: 1, h: 1 }),
    })

    expect(opened).toEqual({ ok: false, message: IMPORT_SPRITE_SHEET_ERRORS.OPEN_FAILED })
    expect(consoleError).toHaveBeenCalledTimes(1)
    consoleError.mockRestore()
  })

  it('returns a user-facing message when the image cannot be decoded', async () => {
    const consoleError = vi.spyOn(console, 'error').mockImplementation(() => {})
    const opened = await openSpriteSheetFile(file, {
      readAsDataUrl: async () => 'data:not-an-image',
      measure: async () => {
        throw new Error('decode failed')
      },
    })

    expect(opened).toEqual({ ok: false, message: IMPORT_SPRITE_SHEET_ERRORS.OPEN_FAILED })
    consoleError.mockRestore()
  })
})

describe('runSpriteSheetImport', () => {
  it('puts the frames on the timeline and saves an animation labelled with the Name', async () => {
    const frames = [buffer(128), buffer(128), buffer(128)]
    const deps = makeDeps(frames)

    await runSpriteSheetImport({ dataUrl: 'data:sheet', name: '  Hero run  ', frameCount: 3 }, deps)

    expect(deps.decodeSheet).toHaveBeenCalledWith('data:sheet', 3)
    expect(deps.importAnimationFrames).toHaveBeenCalledWith(frames, SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS)
    expect(deps.addAnimation).toHaveBeenCalledTimes(1)
    expect(deps.addAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'anim-1',
        label: 'Hero run',
        frames: frames.map((frame) => `data:image/png;base64,${frame.w}`),
        frameDurationMs: SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS,
        timestamp: 1000,
      }),
    )
  })

  it('a single-frame import overwrites the canvas AND saves a one-frame animation labelled with the Name', async () => {
    const deps = makeDeps([])

    await runSpriteSheetImport({ dataUrl: 'data:single', name: '  hero  ', frameCount: 1 }, deps)

    expect(deps.decodeSingle).toHaveBeenCalledWith('data:single')
    expect(deps.overwriteWithPixels).toHaveBeenCalledWith(buffer(128), 'data:single')
    expect(deps.importAnimationFrames).not.toHaveBeenCalled()
    expect(deps.addAnimation).toHaveBeenCalledTimes(1)
    expect(deps.addAnimation).toHaveBeenCalledWith(
      expect.objectContaining({
        id: 'anim-1',
        label: 'hero',
        frames: ['data:image/png;base64,128'],
        frameDurationMs: SPRITE_ANIMATION.DEFAULT_FRAME_DURATION_MS,
        timestamp: 1000,
      }),
    )
  })
})
