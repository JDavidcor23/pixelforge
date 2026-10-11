import { describe, it, expect } from 'vitest'

import type { AudioAsset } from '@/types/audio'
import type { TimelineClip, TimelineDocument, TimelineTrack } from '@/types/timeline'
import {
  GAIN_DB_MAX,
  GAIN_DB_MIN,
  MIN_CLIP_DURATION,
  MIN_TIMELINE_DURATION,
  SNAP_GRID_SECONDS,
  SPEED_MAX,
  SPEED_MIN,
} from '@/constants/timeline'
import {
  addClipFromAsset,
  addTrack,
  collectSnapEdges,
  countClipsForAsset,
  createDefaultTracks,
  createEmptyDocument,
  dbToGain,
  defaultTrackId,
  deleteClip,
  duplicateClip,
  effectiveGain,
  moveClip,
  removeClipsForAsset,
  renameTrack,
  setTrackVolume,
  snapThresholdSeconds,
  snapTime,
  splitAtPlayhead,
  splitClip,
  timelineDuration,
  toggleTrackMute,
  toggleTrackSolo,
  trimClipEnd,
  trimClipStart,
  updateClip,
} from './timeline-ops'

const SFX = defaultTrackId('sfx')
const MUSIC = defaultTrackId('music')
const VOICE = defaultTrackId('dialog')

const sequentialIds = () => {
  let n = 0
  return () => `id-${++n}`
}

const asset = (overrides: Partial<AudioAsset> = {}): AudioAsset => ({
  id: 'a1',
  name: 'boom',
  tags: ['sfx'],
  duration: 2,
  format: 'audio/wav',
  fileSize: 1,
  associatedSpriteIds: [],
  createdAt: '2026-01-01T00:00:00.000Z',
  ...overrides,
})

const clip = (overrides: Partial<TimelineClip> = {}): TimelineClip => ({
  id: 'c1',
  trackId: SFX,
  assetId: 'a1',
  start: 1,
  offset: 0,
  duration: 2,
  gainDb: 0,
  fadeIn: 0,
  fadeOut: 0,
  speed: 1,
  ...overrides,
})

const docWith = (...clips: TimelineClip[]): TimelineDocument => ({ tracks: createDefaultTracks(), clips })

const track = (overrides: Partial<TimelineTrack> = {}): TimelineTrack => ({
  id: 't',
  name: 'T',
  kind: 'sfx',
  muted: false,
  solo: false,
  volume: 0.8,
  ...overrides,
})

// ── Tracks ───────────────────────────────────────────────────────────────────

describe('tracks', () => {
  it('creates Effects / Music / Voice with stable ids', () => {
    const tracks = createDefaultTracks()
    expect(tracks.map((t) => [t.id, t.name, t.kind])).toEqual([
      [SFX, 'Effects', 'sfx'],
      [MUSIC, 'Music', 'music'],
      [VOICE, 'Voice', 'dialog'],
    ])
    expect(tracks.every((t) => !t.muted && !t.solo && t.volume === 1)).toBe(true)
  })

  it('adds a track with the kind default name', () => {
    const { doc, trackId } = addTrack(createEmptyDocument(), 'music', undefined, () => 'new')
    expect(trackId).toBe('new')
    expect(doc.tracks.at(-1)).toMatchObject({ id: 'new', name: 'Music', kind: 'music' })
  })

  it('renames, ignoring blank names and no-op renames', () => {
    const doc = createEmptyDocument()
    expect(renameTrack(doc, SFX, '  Hits ').tracks[0].name).toBe('Hits')
    expect(renameTrack(doc, SFX, '   ')).toBe(doc)
    expect(renameTrack(doc, SFX, 'Effects')).toBe(doc)
    expect(renameTrack(doc, 'missing', 'x')).toBe(doc)
  })

  it('toggles mute/solo and clamps volume to 0..1', () => {
    const doc = createEmptyDocument()
    expect(toggleTrackMute(doc, SFX).tracks[0].muted).toBe(true)
    expect(toggleTrackSolo(doc, MUSIC).tracks[1].solo).toBe(true)
    expect(setTrackVolume(doc, SFX, 3).tracks[0].volume).toBe(1)
    expect(setTrackVolume(doc, SFX, -1).tracks[0].volume).toBe(0)
    expect(setTrackVolume(doc, SFX, 1)).toBe(doc)
  })
})

// ── addClipFromAsset ─────────────────────────────────────────────────────────

describe('addClipFromAsset', () => {
  it('picks the track matching the asset kind', () => {
    const ids = sequentialIds()
    const music = addClipFromAsset(createEmptyDocument(), asset({ tags: ['music'] }), {}, ids)
    const voice = addClipFromAsset(createEmptyDocument(), asset({ tags: ['dialog'] }), {}, ids)
    expect(music.doc.clips[0].trackId).toBe(MUSIC)
    expect(voice.doc.clips[0].trackId).toBe(VOICE)
  })

  it('falls back to the Effects track for untagged assets', () => {
    const { doc } = addClipFromAsset(createEmptyDocument(), asset({ tags: [] }))
    expect(doc.clips[0].trackId).toBe(SFX)
  })

  it('appends after the last clip of that track by default', () => {
    const start = docWith(clip({ start: 1, duration: 2 }), clip({ id: 'c2', start: 0, duration: 5, trackId: MUSIC }))
    const { doc, clipId } = addClipFromAsset(start, asset(), {}, () => 'new')
    expect(clipId).toBe('new')
    expect(doc.clips.at(-1)).toMatchObject({ start: 3, offset: 0, duration: 2, speed: 1, gainDb: 0 })
  })

  it('honors an explicit track and start (clamped ≥ 0)', () => {
    const { doc } = addClipFromAsset(createEmptyDocument(), asset(), { trackId: VOICE, start: -3 })
    expect(doc.clips[0]).toMatchObject({ trackId: VOICE, start: 0 })
  })

  it('does nothing without tracks', () => {
    const empty: TimelineDocument = { tracks: [], clips: [] }
    expect(addClipFromAsset(empty, asset())).toEqual({ doc: empty, clipId: null })
  })
})

// ── move / trim ──────────────────────────────────────────────────────────────

describe('moveClip', () => {
  it('moves and clamps start at 0', () => {
    expect(moveClip(docWith(clip()), 'c1', 4).clips[0].start).toBe(4)
    expect(moveClip(docWith(clip()), 'c1', -2).clips[0].start).toBe(0)
  })

  it('changes track only to an existing track', () => {
    expect(moveClip(docWith(clip()), 'c1', 1, MUSIC).clips[0].trackId).toBe(MUSIC)
    expect(moveClip(docWith(clip()), 'c1', 1, 'nope').clips[0].trackId).toBe(SFX)
  })

  it('returns the same doc for a no-op or unknown clip', () => {
    const doc = docWith(clip())
    expect(moveClip(doc, 'c1', 1)).toBe(doc)
    expect(moveClip(doc, 'x', 3)).toBe(doc)
  })
})

describe('trimClipStart', () => {
  it('moves the left edge and advances the offset by source time', () => {
    const next = trimClipStart(docWith(clip({ speed: 2, duration: 1 })), 'c1', 1.25).clips[0]
    expect(next.start).toBeCloseTo(1.25)
    expect(next.duration).toBeCloseTo(0.75)
    expect(next.offset).toBeCloseTo(0.5)
  })

  it('cannot reveal audio before the source start (offset ≥ 0)', () => {
    const next = trimClipStart(docWith(clip({ start: 2, offset: 0.5, speed: 1 })), 'c1', 0).clips[0]
    expect(next.offset).toBeCloseTo(0)
    expect(next.start).toBeCloseTo(1.5)
    expect(next.duration).toBeCloseTo(2.5)
  })

  it('accounts for speed when extending left', () => {
    const next = trimClipStart(docWith(clip({ start: 2, offset: 1, speed: 2 })), 'c1', 0).clips[0]
    expect(next.start).toBeCloseTo(1.5)
    expect(next.offset).toBeCloseTo(0)
  })

  it('keeps at least MIN_CLIP_DURATION and clamps fades', () => {
    const next = trimClipStart(docWith(clip({ fadeIn: 0.8, fadeOut: 0.8 })), 'c1', 10).clips[0]
    expect(next.duration).toBeCloseTo(MIN_CLIP_DURATION)
    expect(next.fadeIn).toBeCloseTo(MIN_CLIP_DURATION / 2)
    expect(next.fadeOut).toBeCloseTo(MIN_CLIP_DURATION / 2)
  })
})

describe('trimClipEnd', () => {
  it('cannot extend past the end of the source', () => {
    const next = trimClipEnd(docWith(clip({ offset: 0.5, duration: 1 })), 'c1', 10, 2).clips[0]
    expect(next.duration).toBeCloseTo(1.5)
  })

  it('extends further on the timeline when slowed down', () => {
    const next = trimClipEnd(docWith(clip({ speed: 0.5, duration: 1 })), 'c1', 10, 2).clips[0]
    expect(next.duration).toBeCloseTo(4)
  })

  it('shortens and keeps at least MIN_CLIP_DURATION', () => {
    expect(trimClipEnd(docWith(clip()), 'c1', 2, 2).clips[0].duration).toBeCloseTo(1)
    expect(trimClipEnd(docWith(clip()), 'c1', -5, 2).clips[0].duration).toBeCloseTo(MIN_CLIP_DURATION)
  })
})

// ── split ────────────────────────────────────────────────────────────────────

describe('splitClip', () => {
  it('splits into two clips that cover the same source audio', () => {
    const original = clip({ start: 1, offset: 0.5, duration: 2, speed: 1.5, fadeIn: 0.3, fadeOut: 0.4 })
    const { doc, clipId } = splitClip(docWith(original), 'c1', 1.5, () => 'right')
    const [left, right] = doc.clips

    expect(clipId).toBe('right')
    expect(left).toMatchObject({ id: 'c1', start: 1, offset: 0.5, fadeIn: 0.25, fadeOut: 0 })
    expect(left.duration).toBeCloseTo(0.5)
    expect(right).toMatchObject({ id: 'right', start: 1.5, fadeIn: 0, fadeOut: 0.4, speed: 1.5 })
    expect(right.duration).toBeCloseTo(1.5)
    // left consumed 0.5s of timeline at 1.5x → 0.75s of source
    expect(right.offset).toBeCloseTo(1.25)
    expect(left.duration * left.speed + right.duration * right.speed).toBeCloseTo(original.duration * original.speed)
  })

  it('keeps clip order, inserting the right part next to the left', () => {
    const doc = docWith(clip(), clip({ id: 'c2', start: 5 }))
    expect(splitClip(doc, 'c1', 2, () => 'r').doc.clips.map((c) => c.id)).toEqual(['c1', 'r', 'c2'])
  })

  it('is a no-op on the edges, outside, or when a half would be too short', () => {
    const doc = docWith(clip())
    expect(splitClip(doc, 'c1', 1).doc).toBe(doc)
    expect(splitClip(doc, 'c1', 3).doc).toBe(doc)
    expect(splitClip(doc, 'c1', 7).doc).toBe(doc)
    expect(splitClip(doc, 'c1', 1 + MIN_CLIP_DURATION / 2)).toEqual({ doc, clipId: null })
    expect(splitClip(doc, 'missing', 2).doc).toBe(doc)
  })
})

describe('splitAtPlayhead', () => {
  const doc = docWith(
    clip({ id: 'a', trackId: SFX, start: 0, duration: 4 }),
    clip({ id: 'b', trackId: SFX, start: 3, duration: 4 }),
    clip({ id: 'm', trackId: MUSIC, start: 0, duration: 10 })
  )

  it('splits only the selected clip when it is under the playhead', () => {
    const next = splitAtPlayhead(doc, 3.5, 'a', sequentialIds())
    expect(next.clips).toHaveLength(4)
    expect(next.clips.filter((c) => c.trackId === MUSIC)).toHaveLength(1)
  })

  it('splits every clip under the playhead on the selected clip track', () => {
    const next = splitAtPlayhead(doc, 3.5, 'a', sequentialIds())
    const sfxOnly = splitAtPlayhead(docWith(...doc.clips, clip({ id: 's', trackId: SFX, start: 10 })), 3.5, 's', sequentialIds())
    expect(next.clips.find((c) => c.id === 'b')?.duration).toBe(4)
    expect(sfxOnly.clips.filter((c) => c.trackId === SFX)).toHaveLength(5)
    expect(sfxOnly.clips.filter((c) => c.trackId === MUSIC)).toHaveLength(1)
  })

  it('splits every clip under the playhead on all tracks with no selection', () => {
    expect(splitAtPlayhead(doc, 3.5, null, sequentialIds()).clips).toHaveLength(6)
  })

  it('returns the same doc when nothing is under the playhead', () => {
    expect(splitAtPlayhead(doc, 50, null)).toBe(doc)
  })
})

// ── duplicate / delete / remove ──────────────────────────────────────────────

describe('duplicateClip', () => {
  it('places the copy right after the original on the same track', () => {
    const { doc, clipId } = duplicateClip(docWith(clip({ start: 1, duration: 2, gainDb: -3 })), 'c1', () => 'copy')
    expect(clipId).toBe('copy')
    expect(doc.clips[1]).toMatchObject({ id: 'copy', start: 3, trackId: SFX, gainDb: -3, duration: 2 })
  })

  it('returns null for an unknown clip', () => {
    const doc = docWith(clip())
    expect(duplicateClip(doc, 'nope')).toEqual({ doc, clipId: null })
  })
})

describe('delete and asset removal', () => {
  it('deletes a clip', () => {
    expect(deleteClip(docWith(clip(), clip({ id: 'c2' })), 'c1').clips.map((c) => c.id)).toEqual(['c2'])
  })

  it('removes all clips for an asset and counts them', () => {
    const doc = docWith(clip(), clip({ id: 'c2' }), clip({ id: 'c3', assetId: 'a2' }))
    expect(countClipsForAsset(doc.clips, 'a1')).toBe(2)
    expect(removeClipsForAsset(doc, 'a1').clips.map((c) => c.id)).toEqual(['c3'])
    expect(removeClipsForAsset(doc, 'zzz')).toBe(doc)
  })
})

// ── updateClip ───────────────────────────────────────────────────────────────

describe('updateClip', () => {
  it('clamps gain to its range', () => {
    expect(updateClip(docWith(clip()), 'c1', { gainDb: 40 }, 2).clips[0].gainDb).toBe(GAIN_DB_MAX)
    expect(updateClip(docWith(clip()), 'c1', { gainDb: -99 }, 2).clips[0].gainDb).toBe(GAIN_DB_MIN)
  })

  it('changing speed keeps the source span: duration = span / speed', () => {
    const next = updateClip(docWith(clip({ duration: 2, speed: 1 })), 'c1', { speed: 2 }, 4).clips[0]
    expect(next.speed).toBe(2)
    expect(next.duration).toBeCloseTo(1)
  })

  it('clamps speed to SPEED_MIN..SPEED_MAX', () => {
    expect(updateClip(docWith(clip()), 'c1', { speed: 10 }, 4).clips[0].speed).toBe(SPEED_MAX)
    expect(updateClip(docWith(clip()), 'c1', { speed: 0.1 }, 4).clips[0].speed).toBe(SPEED_MIN)
  })

  it('caps fades at half the duration (after a speed change too)', () => {
    const next = updateClip(docWith(clip({ duration: 2 })), 'c1', { fadeIn: 5, fadeOut: 0.5, speed: 2 }, 4).clips[0]
    expect(next.duration).toBeCloseTo(1)
    expect(next.fadeIn).toBeCloseTo(0.5)
    expect(next.fadeOut).toBeCloseTo(0.5)
    expect(updateClip(docWith(clip()), 'c1', { fadeIn: -1 }, 2).clips[0].fadeIn).toBe(0)
  })

  it('returns the same doc when nothing changes', () => {
    const doc = docWith(clip())
    expect(updateClip(doc, 'c1', { gainDb: 0 }, 2)).toBe(doc)
  })
})

// ── snapping ─────────────────────────────────────────────────────────────────

describe('snapTime', () => {
  const opts = { grid: SNAP_GRID_SECONDS, edges: [] as number[], threshold: 0.04 }

  it('snaps to the 0.1s grid within threshold', () => {
    expect(snapTime(1.23, opts)).toBeCloseTo(1.2)
    expect(snapTime(1.27, opts)).toBeCloseTo(1.3)
  })

  it('leaves values outside the threshold alone', () => {
    expect(snapTime(1.25, { ...opts, threshold: 0.01 })).toBe(1.25)
  })

  it('prefers clip edges over the grid', () => {
    expect(snapTime(1.22, { ...opts, edges: [1.237] })).toBe(1.237)
  })

  it('picks the nearest edge', () => {
    expect(snapTime(2, { grid: 0, edges: [1.97, 2.02], threshold: 0.05 })).toBe(2.02)
  })

  it('collects edges excluding the dragged clip, plus 0 and extras', () => {
    const clips = [clip(), clip({ id: 'c2', start: 5, duration: 1 })]
    expect(collectSnapEdges(clips, 'c1', [2.5])).toEqual([0, 5, 6, 2.5])
  })

  it('converts the pixel threshold to seconds', () => {
    expect(snapThresholdSeconds(200)).toBeCloseTo(0.04)
  })
})

// ── mix ──────────────────────────────────────────────────────────────────────

describe('mix helpers', () => {
  it('timelineDuration is the max end, at least MIN_TIMELINE_DURATION', () => {
    expect(timelineDuration([])).toBe(MIN_TIMELINE_DURATION)
    expect(timelineDuration([clip({ start: 5, duration: 2 }), clip({ start: 1 })])).toBe(7)
  })

  it('effectiveGain handles mute and solo', () => {
    expect(effectiveGain(track(), false)).toBe(0.8)
    expect(effectiveGain(track({ muted: true }), false)).toBe(0)
    expect(effectiveGain(track(), true)).toBe(0)
    expect(effectiveGain(track({ solo: true }), true)).toBe(0.8)
    expect(effectiveGain(track({ solo: true, muted: true }), true)).toBe(0)
  })

  it('converts dB to linear gain', () => {
    expect(dbToGain(0)).toBe(1)
    expect(dbToGain(-20)).toBeCloseTo(0.1)
  })
})
