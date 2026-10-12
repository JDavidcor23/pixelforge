import { ANIMATION_PIPELINE_VERSION, ASSET_TYPES } from '@/constants'
import { AI_JOB_FRAME_EXTENSION, AI_JOB_FRAME_INDEX_PAD } from '@/constants/ai-jobs'
import { findLedgerEntry, isLedgerEntrySaved } from '@/lib/animation-job-ledger'
import type { LedgerEntryPatch } from '@/lib/animation-job-ledger'
import type {
  AIAnimation,
  AnimationJobLedgerEntry,
  AssetType,
  ServerAnimationJob,
  ServerAnimationSyncDecision,
} from '@/types'

/*
 * Pure logic of the server → local Assets sync (ADR 0009 follow-up). The
 * `collect-ai-jobs` Edge Function stores finished jobs as `public.assets`
 * rows + one PNG per frame; this copies the ones the browser does not have yet
 * into the local Assets library. Everything is injected, so it runs in Node.
 */

const DEFAULT_ASSET_TYPE: AssetType = 'character'
const BASE64_CHUNK_SIZE = 0x8000
const PNG_DATA_URI_PREFIX = 'data:image/png;base64,'

/** Storage path of frame `index` inside an asset folder (`<folder>/000.png`). */
export const serverFramePath = (filePath: string, index: number): string => {
  const folder = filePath.endsWith('/') ? filePath : `${filePath}/`
  return `${folder}${String(index).padStart(AI_JOB_FRAME_INDEX_PAD, '0')}${AI_JOB_FRAME_EXTENSION}`
}

export const toAssetType = (value: string | null | undefined): AssetType =>
  ASSET_TYPES.find((type) => type.id === value)?.id ?? DEFAULT_ASSET_TYPE

/** PNG bytes → data URI, chunked so a large frame never overflows `String.fromCharCode`'s argument limit. */
export const pngBytesToDataUri = (bytes: Uint8Array): string => {
  let binary = ''
  for (let offset = 0; offset < bytes.length; offset += BASE64_CHUNK_SIZE) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + BASE64_CHUNK_SIZE))
  }
  return `${PNG_DATA_URI_PREFIX}${btoa(binary)}`
}

export interface ServerAnimationSyncState {
  readonly ledgerEntries: readonly AnimationJobLedgerEntry[]
  /** Ids already in the local Assets library. Server animations are saved under their asset id. */
  readonly localAnimationIds: ReadonlySet<string>
  readonly syncedJobIds: readonly string[]
  /** The job an Animate polling loop owns right now — it saves it itself. */
  readonly activeJobId: string | null
}

/**
 * What to do with each completed server job:
 * - already synced, or owned by the running polling loop → left out entirely
 * - already in the local library (same asset id) or saved by the browser's
 *   own loop / a Recover (ledger completed/recovered) → `skip` (just remembered)
 * - anything else → `import`
 */
export const planServerAnimationSync = (
  jobs: readonly ServerAnimationJob[],
  state: ServerAnimationSyncState,
): ServerAnimationSyncDecision[] => {
  const synced = new Set(state.syncedJobIds)
  return jobs
    .filter((job) => !synced.has(job.providerJobId) && job.providerJobId !== state.activeJobId)
    .map((job): ServerAnimationSyncDecision => {
      const alreadyLocal =
        state.localAnimationIds.has(job.assetId) ||
        isLedgerEntrySaved(findLedgerEntry(state.ledgerEntries, job.providerJobId))
      return alreadyLocal ? { kind: 'skip', job } : { kind: 'import', job }
    })
}

/** The local Assets entry for a server-collected job. Its id IS the server asset id, so it dedupes across devices. */
export const buildServerAnimationAsset = (job: ServerAnimationJob, frames: readonly string[]): AIAnimation => ({
  pipelineVersion: ANIMATION_PIPELINE_VERSION,
  id: job.assetId,
  label: job.label,
  frames,
  frameDurationMs: job.frameDurationMs,
  timestamp: job.createdAt,
  assetType: job.assetType,
})

export interface ServerAnimationSyncDeps {
  readonly listCompletedJobs: () => Promise<readonly ServerAnimationJob[]>
  readonly downloadFrames: (job: ServerAnimationJob) => Promise<readonly string[]>
  readonly getState: () => ServerAnimationSyncState
  readonly addAnimation: (animation: AIAnimation) => void
  readonly updateLedger: (jobId: string, patch: LedgerEntryPatch) => void
  readonly markSynced: (jobIds: readonly string[]) => void
  readonly now: () => number
}

export interface ServerAnimationSyncResult {
  readonly imported: readonly string[]
  readonly failed: readonly string[]
}

/**
 * One sync pass. A job whose frames fail to download is NOT marked synced, so
 * the next pass retries it. State is re-read before every write: the polling
 * loop or a Recover may have saved the same job while frames were downloading.
 */
export const syncServerAnimations = async (deps: ServerAnimationSyncDeps): Promise<ServerAnimationSyncResult> => {
  const jobs = await deps.listCompletedJobs()
  const decisions = planServerAnimationSync(jobs, deps.getState())

  const skipped = decisions.filter((decision) => decision.kind === 'skip').map((decision) => decision.job.providerJobId)
  if (skipped.length > 0) deps.markSynced(skipped)

  const imported: string[] = []
  const failed: string[] = []
  for (const decision of decisions) {
    if (decision.kind !== 'import') continue
    const { job } = decision
    let frames: readonly string[]
    try {
      frames = await deps.downloadFrames(job)
    } catch {
      failed.push(job.providerJobId)
      continue
    }
    if (frames.length === 0) {
      failed.push(job.providerJobId)
      continue
    }

    // Saved meanwhile (polling loop, Recover, another tab)? Then only remember it.
    const [recheck] = planServerAnimationSync([job], deps.getState())
    if (recheck?.kind === 'import') {
      deps.addAnimation(buildServerAnimationAsset(job, frames))
      if (findLedgerEntry(deps.getState().ledgerEntries, job.providerJobId)) {
        deps.updateLedger(job.providerJobId, {
          status: 'recovered',
          animationId: job.assetId,
          error: null,
          lastState: null,
          lastCheckedAt: deps.now(),
          lastCheckUnreachable: false,
        })
      }
      imported.push(job.providerJobId)
    }
    if (recheck) deps.markSynced([job.providerJobId])
  }

  return { imported, failed }
}
