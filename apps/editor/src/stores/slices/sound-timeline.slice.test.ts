import { describe, it, expect, beforeEach } from 'vitest'

import { useSoundsStore } from '@/stores/sounds.store'
import { selectCanRedo, selectCanUndo, selectClipCountForAsset } from '@/stores/selectors/sound-timeline.selectors'
import type { AudioAsset } from '@/types/audio'
import {
  DEFAULT_PROJECT_NAME,
  DEFAULT_PX_PER_SECOND,
  HISTORY_LIMIT,
  MAX_PX_PER_SECOND,
  MIN_PX_PER_SECOND,
  ZOOM_STEP,
} from '@/constants/timeline'
import { defaultTrackId } from '@/lib/timeline-ops'

const store = () => useSoundsStore.getState()

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

describe('sound timeline slice', () => {
  beforeEach(() => {
    useSoundsStore.setState(useSoundsStore.getInitialState())
    store().addAsset(asset())
    store().addAsset(asset({ id: 'a2', tags: ['music'], duration: 10 }))
  })

  it('starts with defaults and no history', () => {
    expect(store().projectName).toBe(DEFAULT_PROJECT_NAME)
    expect(store().tracks).toHaveLength(3)
    expect(store().clips).toEqual([])
    expect(store().pxPerSecond).toBe(DEFAULT_PX_PER_SECOND)
    expect(store().editorView).toBe('timeline')
    expect(selectCanUndo(store())).toBe(false)
  })

  it('addClip places by kind, selects the clip and records history', () => {
    const id = store().addClip('a2')
    expect(store().clips[0]).toMatchObject({ id, trackId: defaultTrackId('music'), duration: 10 })
    expect(store().selectedClipId).toBe(id)
    expect(selectCanUndo(store())).toBe(true)
    expect(store().addClip('unknown')).toBeNull()
  })

  it('trimEnd is clamped to the asset source duration', () => {
    const id = store().addClip('a1')!
    store().trimEnd(id, 50)
    expect(store().clips[0].duration).toBe(2)
  })

  it('updateClip speed uses the asset duration', () => {
    const id = store().addClip('a1')!
    store().updateClip(id, { speed: 0.5 })
    expect(store().clips[0].duration).toBeCloseTo(4)
  })

  it('undo / redo restore the document and drop dangling selection', () => {
    const id = store().addClip('a1')!
    store().moveClip(id, 5)
    store().undo()
    expect(store().clips[0].start).toBe(0)
    store().undo()
    expect(store().clips).toEqual([])
    expect(store().selectedClipId).toBeNull()
    expect(selectCanRedo(store())).toBe(true)
    store().redo()
    store().redo()
    expect(store().clips[0].start).toBe(5)
    expect(selectCanRedo(store())).toBe(false)
  })

  it('a new edit clears the redo stack', () => {
    const id = store().addClip('a1')!
    store().moveClip(id, 5)
    store().undo()
    store().moveClip(id, 7)
    expect(selectCanRedo(store())).toBe(false)
  })

  it('no-op edits do not record history', () => {
    const id = store().addClip('a1')!
    const pastLength = store().timelinePast.length
    store().moveClip(id, 0)
    store().split(id, 100)
    expect(store().timelinePast).toHaveLength(pastLength)
  })

  it('caps history at HISTORY_LIMIT', () => {
    const id = store().addClip('a1')!
    for (let i = 1; i <= HISTORY_LIMIT + 10; i++) store().moveClip(id, i)
    expect(store().timelinePast).toHaveLength(HISTORY_LIMIT)
  })

  describe('gestures', () => {
    it('batch a continuous drag into ONE undo step', () => {
      const id = store().addClip('a1')!
      const pastLength = store().timelinePast.length
      store().beginGesture()
      for (let i = 1; i <= 20; i++) store().moveClip(id, i * 0.1)
      store().endGesture()
      expect(store().timelinePast).toHaveLength(pastLength + 1)
      store().undo()
      expect(store().clips[0].start).toBe(0)
    })

    it('record nothing when the gesture changed nothing', () => {
      store().addClip('a1')
      const pastLength = store().timelinePast.length
      store().beginGesture()
      store().endGesture()
      expect(store().timelinePast).toHaveLength(pastLength)
    })

    it('cancelGesture reverts without history', () => {
      const id = store().addClip('a1')!
      const pastLength = store().timelinePast.length
      store().beginGesture()
      store().moveClip(id, 3)
      store().cancelGesture()
      expect(store().clips[0].start).toBe(0)
      expect(store().timelinePast).toHaveLength(pastLength)
      expect(store().timelineGestureSnapshot).toBeNull()
    })

    it('undo mid-gesture closes the gesture first', () => {
      const id = store().addClip('a1')!
      store().beginGesture()
      store().moveClip(id, 3)
      store().undo()
      expect(store().clips[0].start).toBe(0)
      expect(store().timelineGestureSnapshot).toBeNull()
    })
  })

  it('split / duplicate / delete keep selection consistent', () => {
    const id = store().addClip('a1')!
    const right = store().split(id, 1)
    expect(store().clips).toHaveLength(2)
    const copy = store().duplicate(right!)
    expect(store().selectedClipId).toBe(copy)
    expect(store().clips.find((c) => c.id === copy)?.start).toBe(2)
    store().deleteClip(copy!)
    expect(store().selectedClipId).toBeNull()
  })

  it('splitAtPlayhead uses the playhead and selection', () => {
    store().addClip('a1')
    store().setPlayhead(0.5)
    store().splitAtPlayhead()
    expect(store().clips).toHaveLength(2)
  })

  it('track edits, project name and view state', () => {
    const sfx = defaultTrackId('sfx')
    store().toggleMute(sfx)
    store().toggleSolo(sfx)
    store().setTrackVolume(sfx, 0.3)
    store().renameTrack(sfx, 'Hits')
    expect(store().tracks[0]).toMatchObject({ muted: true, solo: true, volume: 0.3, name: 'Hits' })
    const trackId = store().addTrack('dialog')
    expect(store().tracks.at(-1)?.id).toBe(trackId)

    store().setProjectName('  boss_fight ')
    store().setProjectName('   ')
    expect(store().projectName).toBe('boss_fight')
    store().undo()
    expect(store().projectName).toBe(DEFAULT_PROJECT_NAME)

    store().setPlayhead(-1)
    store().toggleSnap()
    store().setEditorView('sound')
    expect(store()).toMatchObject({ playheadTime: 0, snapEnabled: false, editorView: 'sound' })
  })

  it('zoom is stepped and clamped', () => {
    store().zoomIn()
    expect(store().pxPerSecond).toBeCloseTo(DEFAULT_PX_PER_SECOND * ZOOM_STEP)
    store().setZoom(1e6)
    expect(store().pxPerSecond).toBe(MAX_PX_PER_SECOND)
    store().setZoom(1)
    store().zoomOut()
    expect(store().pxPerSecond).toBe(MIN_PX_PER_SECOND)
  })

  it('selectClip ignores unknown ids', () => {
    store().selectClip('ghost')
    expect(store().selectedClipId).toBeNull()
  })

  describe('library integration', () => {
    it('removing an asset drops its clips, selection and history references', () => {
      const id = store().addClip('a1')!
      store().addClip('a2')
      store().addClip('a1')
      expect(selectClipCountForAsset('a1')(store())).toBe(2)
      store().selectClip(id)

      store().removeAsset('a1')

      expect(store().clips.map((c) => c.assetId)).toEqual(['a2'])
      expect(store().selectedClipId).toBeNull()
      expect(selectClipCountForAsset('a1')(store())).toBe(0)
      store().undo()
      store().undo()
      expect(store().clips.every((c) => c.assetId !== 'a1')).toBe(true)
    })

    it('counts zero for a null asset id', () => {
      expect(selectClipCountForAsset(null)(store())).toBe(0)
    })
  })
})
