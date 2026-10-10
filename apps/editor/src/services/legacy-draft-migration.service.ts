import type { DocumentFramePayload, DocumentLayerPayload, DocumentPayload, DocumentRepository } from '@/types/document'
import type { RgbaColor } from '@/types'
import { rowsToBuffer } from '@/lib/pixel-codec'
import {
  LEGACY_SPRITE_EDITOR_STORAGE_KEY,
  LOCAL_DRAFT_DOCUMENT_ID,
  DOCUMENT_SCHEMA_VERSION,
} from '@/constants/persistence'

interface LegacyLayer {
  id: string
  name: string
  visible: boolean
  locked: boolean
  opacity: number
  pixels: RgbaColor[][]
}

interface LegacyFrame {
  id: string
  layers: LegacyLayer[]
  activeLayerId: string
  durationMs: number
}

interface LegacyPersistedState {
  canvasWidth?: number
  canvasHeight?: number
  layers?: LegacyLayer[]
  timeline?: { frames?: LegacyFrame[] }
  primaryColor?: RgbaColor
  secondaryColor?: RgbaColor
}

export interface LegacyMigrationResult {
  readonly migrated: boolean
  readonly colors: { readonly primaryColor: RgbaColor; readonly secondaryColor: RgbaColor } | null
}

const NOT_MIGRATED: LegacyMigrationResult = { migrated: false, colors: null }

function parseLegacyState(raw: string): LegacyPersistedState | null {
  try {
    const parsed = JSON.parse(raw) as { state?: LegacyPersistedState }
    return parsed.state ?? null
  } catch {
    return null
  }
}

function legacyLayerToPayload(layer: LegacyLayer): DocumentLayerPayload {
  return {
    id: layer.id,
    name: layer.name,
    visible: layer.visible,
    locked: layer.locked,
    opacity: layer.opacity,
    data: new Uint8Array(rowsToBuffer(layer.pixels).data),
  }
}

function legacyStateToPayload(state: LegacyPersistedState): DocumentPayload | null {
  const frames = state.timeline?.frames
  const layers = state.layers
  if (!layers || layers.length === 0 || !frames || frames.length === 0) return null

  const framePayloads: DocumentFramePayload[] = frames.map((f) => ({
    id: f.id,
    activeLayerId: f.activeLayerId,
    layers: f.layers.map(legacyLayerToPayload),
  }))

  return {
    schemaVersion: DOCUMENT_SCHEMA_VERSION,
    w: state.canvasWidth ?? layers[0].pixels[0]?.length ?? 0,
    h: state.canvasHeight ?? layers[0].pixels.length ?? 0,
    frameMs: frames.map((f) => f.durationMs),
    frames: framePayloads,
  }
}

/**
 * One-time, idempotent migration: moves a pre-phase-1 `sprite-editor-core`
 * localStorage draft (`RgbaColor[][]` pixels) into IndexedDB as a flat-buffer
 * `StoredDocument`. Mirrors design.md's "Migration / Rollout" section.
 *
 * - If a draft already exists in IndexedDB, it WINS: the legacy key is
 *   removed without conversion (migration already ran, or the user started
 *   fresh after phase 1 shipped).
 * - If no draft exists and the legacy entry has `layers`/`timeline`, it is
 *   converted and saved; the legacy key is removed ONLY after that save
 *   resolves, so a failed save keeps the legacy key and the next load
 *   retries (never a silent data loss).
 * - An unreadable or incomplete legacy entry is left untouched — nothing to
 *   migrate, and we don't guess at destroying data we can't parse.
 *
 * `storage` is injected (not read from the global `localStorage` directly)
 * so this is testable without a real DOM/browser storage.
 */
export async function migrateLegacyDraft(
  repository: DocumentRepository,
  storage: Pick<Storage, 'getItem' | 'removeItem'>
): Promise<LegacyMigrationResult> {
  const raw = storage.getItem(LEGACY_SPRITE_EDITOR_STORAGE_KEY)
  if (!raw) return NOT_MIGRATED

  const existingDraft = await repository.load(LOCAL_DRAFT_DOCUMENT_ID)
  if (existingDraft) {
    storage.removeItem(LEGACY_SPRITE_EDITOR_STORAGE_KEY)
    return NOT_MIGRATED
  }

  const legacyState = parseLegacyState(raw)
  const payload = legacyState ? legacyStateToPayload(legacyState) : null
  if (!legacyState || !payload) {
    return NOT_MIGRATED
  }

  await repository.save({
    id: LOCAL_DRAFT_DOCUMENT_ID,
    revision: 1,
    updatedAt: Date.now(),
    payload,
  })

  // Only after save() resolves — if it threw, this line never runs and the
  // legacy key survives for the next load to retry.
  storage.removeItem(LEGACY_SPRITE_EDITOR_STORAGE_KEY)

  return {
    migrated: true,
    colors:
      legacyState.primaryColor && legacyState.secondaryColor
        ? { primaryColor: legacyState.primaryColor, secondaryColor: legacyState.secondaryColor }
        : null,
  }
}
