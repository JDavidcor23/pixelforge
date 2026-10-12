/* ── Animation provider: PixelLab (ADR 0009) ────────────────────────────────
 * Imported by the client AND by the Vercel Functions in `api/ai/pixellab/`, so
 * this file must stay free of runtime imports (no `@/` alias, no tokens).
 *
 * Measured 2026-10-12 with `scripts/pixellab-animate-harness.ts`:
 * output keeps the input size (max 256), `w*h*frames <= 524288`, the job
 * response holds `frame_count + 1` images (index 0 is the input frame),
 * generation takes 110–160 s and the free tier allows ONE concurrent job.
 */
export const PIXELLAB_API_BASE = 'https://api.pixellab.ai/v2'
export const PIXELLAB_ANIMATE_PATH = '/animate-with-text-v3'
export const PIXELLAB_JOB_PATH = '/background-jobs'

/** Editor-side Vercel Functions. */
export const PIXELLAB_ANIMATE_ROUTE = '/api/ai/pixellab/animate'
export const PIXELLAB_JOB_ROUTE = '/api/ai/pixellab/job'
/** Query param carrying the job id on `PIXELLAB_JOB_ROUTE`. */
export const PIXELLAB_JOB_ID_PARAM = 'id'
/** BYOK on the status route travels in a header, never in the URL (URLs end up in logs). */
export const PIXELLAB_KEY_HEADER = 'x-pixellab-key'

export const PIXELLAB_MAX_SIZE = 256
export const PIXELLAB_PIXEL_BUDGET = 524288
export const PIXELLAB_MIN_FRAMES = 4
export const PIXELLAB_MAX_FRAMES = 16
/** Only the submit and the status reads are bounded — the generation itself runs upstream. */
export const PIXELLAB_REQUEST_TIMEOUT_MS = 30000
/** Job ids are opaque; this only keeps path characters out of the upstream URL. */
export const PIXELLAB_JOB_ID_PATTERN = /^[A-Za-z0-9_-]+$/

/** Index 0 of a finished job's images is the input frame, not a generated one. */
export const PIXELLAB_INPUT_FRAME_INDEX = 0

export const PIXELLAB_MISSING_KEY_ERROR =
  'Missing PixelLab API key. Add it in settings or set PIXELLAB_API_KEY.'
export const PIXELLAB_BUSY_ERROR =
  'PixelLab is already generating an animation for this account. Wait for it to finish, then try again.'
export const PIXELLAB_NO_FRAMES_ERROR = 'PixelLab finished the job but returned no frames.'
export const PIXELLAB_JOB_FAILED_ERROR = 'PixelLab could not generate this animation.'
export const PIXELLAB_INVALID_PNG_ERROR = 'The reference frame must be a PNG image.'

/** Animate tab polling (client side). */
export const ANIMATION_POLL_INTERVAL_MS = 3000
/**
 * One polling window. 8-frame jobs took 110–160 s, but 12-frame 128px jobs
 * plus queue time measured over 5 min. Running out of the window only PAUSES
 * polling — the job is kept and "Check again" opens a fresh window.
 */
export const ANIMATION_POLL_TIMEOUT_MS = 900000
/** Status reads that fail this many times in a row pause polling (job kept), never drop the job. */
export const ANIMATION_POLL_MAX_CONSECUTIVE_ERRORS = 3
/** Elapsed-time display refresh while a job runs. */
export const ANIMATION_ELAPSED_TICK_MS = 1000

/** Even counts only, 4..16 (PixelLab limit). The pixel budget can rule out the top ones at 256px. */
export const ANIMATION_FRAME_OPTIONS = [4, 6, 8, 12, 16] as const

export const ANIMATION_ALREADY_RUNNING_ERROR = 'An animation is already being generated. Wait for it to finish.'
export const ANIMATION_REFERENCE_EXPORT_ERROR = 'Could not export the current frame as a reference.'
export const ANIMATION_GENERIC_ERROR = 'Animation generation failed.'
export const ANIMATION_NOT_SQUARE_ERROR = 'Animations need a square canvas. Resize the canvas first.'
export const ANIMATION_TOO_LARGE_ERROR = `Animations support canvases up to ${PIXELLAB_MAX_SIZE}x${PIXELLAB_MAX_SIZE}. Resize the canvas first.`
export const ANIMATION_FRAMES_INVALID_ERROR = `Frame count must be an even number from ${PIXELLAB_MIN_FRAMES} to ${PIXELLAB_MAX_FRAMES}.`
export const ANIMATION_FRAMES_OVER_BUDGET_ERROR = 'Too many frames for this canvas size. Pick fewer frames.'

/** Neutral copy for the "another job is running" state — distinct from the danger-styled error copy above. */
export const ANIMATION_BUSY_MESSAGE =
  'A generation is already running. Wait for it to finish before starting another.'
/** Shown under the Generate button while a job is in flight and PixelLab sent no queue info. */
export const ANIMATION_GENERATING_HINT = 'Usually takes 2–6 min. You can keep editing.'

/** Generate button label while a job runs, by PixelLab's reported state (followed by the elapsed `m:ss`). */
export const ANIMATION_QUEUED_LABEL = 'Queued on PixelLab…'
export const ANIMATION_GENERATING_LABEL = 'Generating…'

/** Queue hint parts, e.g. "In queue: #3 · ~2 min left". */
export const ANIMATION_QUEUE_POSITION_PREFIX = 'In queue: #'
export const ANIMATION_WAIT_PREFIX = '~'
export const ANIMATION_WAIT_SUFFIX = ' min left'
export const ANIMATION_HINT_SEPARATOR = ' · '

/** Polling paused on a job that is still kept (neutral, not an error). */
export const ANIMATION_STALLED_MESSAGE =
  'Still running on PixelLab. Your animation is saved — check again in a minute.'
export const ANIMATION_STALLED_NETWORK_MESSAGE =
  'Lost contact with PixelLab. Your animation is saved — check again in a minute.'
export const ANIMATION_CHECK_AGAIN_LABEL = 'Check again'
export const ANIMATION_DISCARD_LABEL = 'Discard'
export const ANIMATION_DISCARD_HINT =
  'Discard stops tracking this job. PixelLab may still bill the generation.'

/** Elapsed-time formatting (m:ss) for the Generate button while a job runs. */
export const ANIMATION_SECONDS_PER_MINUTE = 60
