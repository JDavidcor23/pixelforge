import { describe, expect, it } from 'vitest'

import { mapPixelLabJob, readPngSize, stripDataUri } from './pixellab-job'
import { PIXELLAB_JOB_FAILED_ERROR, PIXELLAB_NO_FRAMES_ERROR } from '@/constants/animation'

/** Minimal PNG header (signature + IHDR width/height) — enough for `readPngSize`. */
const pngHeaderBase64 = (width: number, height: number): string => {
  const bytes = new Uint8Array(24)
  bytes.set([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a, 0, 0, 0, 13, 0x49, 0x48, 0x44, 0x52])
  const view = new DataView(bytes.buffer)
  view.setUint32(16, width)
  view.setUint32(20, height)
  return btoa(String.fromCharCode(...bytes))
}

describe('mapPixelLabJob', () => {
  it('drops the input frame (index 0) and returns PNG data URIs', () => {
    const status = mapPixelLabJob({
      status: 'completed',
      last_response: {
        images: [
          { type: 'base64', base64: 'INPUT', format: 'png' },
          { type: 'base64', base64: 'F1', format: 'png' },
          { type: 'base64', base64: 'F2', format: 'png' },
        ],
      },
      usage: { usd: 0.02 },
    })

    expect(status).toEqual({
      status: 'completed',
      frames: ['data:image/png;base64,F1', 'data:image/png;base64,F2'],
      error: null,
      costUsd: 0.02,
    })
  })

  it('accepts bare and data-URI string images', () => {
    const status = mapPixelLabJob({
      status: 'completed',
      last_response: { images: ['INPUT', 'F1', 'data:image/png;base64,F2'] },
    })

    expect(status.frames).toEqual(['data:image/png;base64,F1', 'data:image/png;base64,F2'])
    expect(status.costUsd).toBeNull()
  })

  it('reports a completed job with only the input frame as failed', () => {
    const status = mapPixelLabJob({ status: 'completed', last_response: { images: ['INPUT'] } })

    expect(status.status).toBe('failed')
    expect(status.error).toBe(PIXELLAB_NO_FRAMES_ERROR)
  })

  it('surfaces the upstream detail of a failed job', () => {
    expect(mapPixelLabJob({ status: 'failed', last_response: { detail: 'NSFW' } }).error).toBe('NSFW')
    expect(mapPixelLabJob({ status: 'failed', last_response: { detail: { code: 1 } } }).error).toBe('{"code":1}')
    expect(mapPixelLabJob({ status: 'failed' }).error).toBe(PIXELLAB_JOB_FAILED_ERROR)
  })

  it('keeps queued/processing jobs frameless and treats unknown states as processing', () => {
    expect(mapPixelLabJob({ status: 'queued' })).toEqual({ status: 'queued', frames: [], error: null, costUsd: null })
    expect(mapPixelLabJob({ status: 'something-new' }).status).toBe('processing')
  })
})

describe('readPngSize', () => {
  it('reads width and height from the IHDR header, with or without a data URI', () => {
    expect(readPngSize(pngHeaderBase64(128, 128))).toEqual({ width: 128, height: 128 })
    expect(readPngSize(`data:image/png;base64,${pngHeaderBase64(64, 32)}`)).toEqual({ width: 64, height: 32 })
  })

  it('rejects data that is not a PNG', () => {
    expect(readPngSize(btoa('GIF89a not a png at all......'))).toBeNull()
    expect(readPngSize('%%%not-base64%%%')).toBeNull()
  })
})

describe('stripDataUri', () => {
  it('removes the data URI prefix only', () => {
    expect(stripDataUri('data:image/png;base64,AAAA')).toBe('AAAA')
    expect(stripDataUri('AAAA')).toBe('AAAA')
  })
})
