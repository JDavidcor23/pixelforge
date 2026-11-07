/** Where an asset's bytes live. The catalog never holds bytes itself (ADR 0014 D3). */
export type CatalogStoragePointer =
  | {
      /** Sprite document in the IndexedDB assets library (`generations` object store), keyed by id. */
      readonly type: 'sprite-library'
      readonly assetId: string
    }
  | {
      /** Sound file: the Supabase public URL and/or the session-local object URL. */
      readonly type: 'sound-source'
      readonly supabaseUrl: string | undefined
      readonly localObjectUrl: string | undefined
    }

export type CatalogAssetKind = 'sprite' | 'sound'

/** One normalized, derived asset record (ADR 0016). Identity = `id` + `revision`. */
export interface CatalogEntry {
  readonly id: string
  readonly kind: CatalogAssetKind
  /** Bumped on every content edit; absent in the source means 0. */
  readonly revision: number
  /** Always `undefined` today: no level ids exist yet. */
  readonly levelId: string | undefined
  /** Always `undefined` today: no chat turn ids exist yet. */
  readonly chatTurnId: string | undefined
  /** Display and search name (trimmed prompt or sound name). */
  readonly name: string
  readonly storage: CatalogStoragePointer
}

export interface AssetCatalog {
  readonly byId: Readonly<Record<string, CatalogEntry>>
  readonly allIds: readonly string[]
}
