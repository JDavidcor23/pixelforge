import type { AnimationHarness, AnimationMotionPreset, AssetType } from '../types'

/**
 * Animation harness (ADR 0009): per asset type, the identity rules and the
 * motion catalogue sent to the animation provider. Data, not code — the
 * Animate tab AND `scripts/pixellab-animate-harness.ts` (the offline eval
 * bench) read this same object, so what is measured is what ships.
 *
 * This file must keep ZERO runtime imports: the eval script loads it with
 * `node --experimental-strip-types`, which resolves neither the `@/` alias nor
 * extensionless relative imports. `import type` is erased, so it is fine.
 *
 * Measured 2026-10-12 (wizard-128, 8 frames): identity rules FIRST + an
 * explicit motion gave real steps, the same hand on the staff and the same
 * scale. A bare "walking" turned the character toward the camera and swapped
 * hands; `enhance_prompt` stepped but drifted to side profile; sending the
 * first frame as `last_frame` too killed the motion. Idle (same day, 12 frames):
 * without `last_frame` the wizard turned toward the camera by frame 7; with it
 * he stayed on-model and the loop closed — so `last_frame` is opt-in per motion
 * (`loopToFirstFrame`). A stricter idle prompt did not help. Every new motion must pass
 * the eval script on a real sprite before it ships.
 */

const CUSTOM_MOTION_ID = 'custom'

/** Character identity rules — generalized from the measured wizard prompt ("same hand holds the staff"). */
const CHARACTER_IDENTITY_RULES =
  'Keep the exact same character, facing angle and camera view as the first frame. ' +
  'Do not turn or rotate the body. Held items stay in the same hand in every frame. ' +
  'Held items keep their full length and shape in every frame, they never shrink or disappear. ' +
  'Held items keep the same angle as in the first frame, they never tilt or lie flat.'

/**
 * Non-character subjects may legitimately turn (Spin), so their rules pin
 * shape, palette and camera — not rotation.
 */
const subjectIdentityRules = (subject: string): string =>
  `Keep the exact same ${subject}: same shape, palette and proportions as the first frame. ` +
  'Same camera view, it stays centered in place.'

const customPreset = (defaultFrames: number): AnimationMotionPreset => ({
  id: CUSTOM_MOTION_ID,
  label: 'Custom',
  motion: '',
  defaultFrames,
  isCustomInput: true,
})

const CHARACTER_MOTIONS: readonly AnimationMotionPreset[] = [
  {
    id: 'idle',
    label: 'Idle',
    motion: 'idle breathing loop in place: chest rises and falls, head and shoulders bob slightly, feet stay planted, clothing sways gently',
    defaultFrames: 4,
    loopToFirstFrame: true,
    detailPlaceholder: 'Add detail if this character idles in a specific way, e.g. "taps one foot" or "looks around slowly"',
  },
  {
    // The measured best prompt (2026-10-12), with "robe" generalized to clothing.
    id: 'walk',
    label: 'Walk',
    motion: 'walking cycle in place: legs alternate clear steps, clothing swings with each step, body bobs slightly',
    defaultFrames: 8,
    detailPlaceholder: 'Add detail if this character walks in a specific way, e.g. "limps on the right leg" or "floats, feet barely touch the ground"',
  },
  {
    id: 'run',
    label: 'Run',
    motion: 'running cycle in place: long fast strides with both feet leaving the ground, arms pump opposite to the legs, body leans slightly forward, clothing flaps with each stride',
    defaultFrames: 8,
    detailPlaceholder: 'Add detail if this character runs in a specific way, e.g. "on all fours" or "drags a wounded leg"',
  },
  {
    id: 'jump',
    label: 'Jump',
    motion: 'energetic jump in place: a moderate knee bend, push off so both feet clearly leave the ground, rise high into the air with legs tucked, then land on the same spot with a slight bend; the free arm swings down on the bend and up on the rise, the arm holding an item moves only a little and the item stays upright, rising and falling with the body',
    defaultFrames: 8,
    // Starts and ends standing, so the last frame can anchor to the first (as idle).
    loopToFirstFrame: true,
    detailPlaceholder: 'Add detail if this character jumps in a specific way, e.g. "jumps off only the right leg" or "flaps wings to gain height"',
  },
  {
    id: 'attack',
    label: 'Attack',
    motion: 'attack in place: raise the held item or fist back first, then swing it forward through a clear mid-swing position before the strike, then return to the start pose',
    defaultFrames: 6,
    detailPlaceholder: 'Describe how THIS character attacks: melee swing or ranged shot, which weapon or body part, and the pose — the provider cannot guess this from "attack" alone',
  },
  {
    id: 'crouch',
    label: 'Crouch',
    motion: 'crouch in place: bend the knees and lower the body, hold the low pose, then rise back to standing',
    defaultFrames: 4,
    detailPlaceholder: 'Add detail if this character crouches in a specific way, e.g. "kneels on one knee" or "curls into a ball"',
  },
  customPreset(8),
]

/** object/weapon/costume/effect share one motion set; only their identity rules differ. */
const SUBJECT_MOTIONS: readonly AnimationMotionPreset[] = [
  {
    id: 'breathe',
    label: 'Breathe',
    motion: 'subtle idle loop in place: it gently expands and contracts a little, nothing else moves',
    defaultFrames: 4,
    detailPlaceholder: 'Add detail if it breathes in a specific way, e.g. "pulses with a faint inner glow"',
  },
  {
    id: 'squash',
    label: 'Squash & stretch',
    motion: 'squash and stretch loop in place: squashes down wide, stretches up tall, then returns to its original shape, bouncy cartoon timing',
    defaultFrames: 6,
    detailPlaceholder: 'Add detail if it squashes in a specific way, e.g. "wobbles like jelly" or "only the top half stretches"',
  },
  {
    id: 'spin',
    label: 'Spin',
    motion: 'spins in place around its vertical axis for one full turn and ends facing the same way as the first frame',
    defaultFrames: 8,
    detailPlaceholder: 'Add detail if it spins in a specific way, e.g. "trails a ribbon of light" or "spins faster near the end"',
  },
  {
    id: 'break',
    label: 'Break apart',
    motion: 'breaks apart: cracks appear, it splits into pieces, the pieces fall and scatter into debris',
    defaultFrames: 8,
    detailPlaceholder: 'Add detail if it breaks in a specific way, e.g. "shatters into glass shards" or "melts instead of cracking"',
  },
  customPreset(6),
]

export const ANIMATION_HARNESS: AnimationHarness = {
  character: { identityRules: CHARACTER_IDENTITY_RULES, defaultMotionId: 'idle', motions: CHARACTER_MOTIONS },
  object: { identityRules: subjectIdentityRules('object'), defaultMotionId: 'breathe', motions: SUBJECT_MOTIONS },
  weapon: { identityRules: subjectIdentityRules('weapon'), defaultMotionId: 'breathe', motions: SUBJECT_MOTIONS },
  costume: { identityRules: subjectIdentityRules('costume'), defaultMotionId: 'breathe', motions: SUBJECT_MOTIONS },
  effect: { identityRules: subjectIdentityRules('effect'), defaultMotionId: 'breathe', motions: SUBJECT_MOTIONS },
}

/** The preset for `motionId`, falling back to the asset type's default motion. */
export function findAnimationMotion(assetType: AssetType, motionId: string): AnimationMotionPreset {
  const { motions, defaultMotionId } = ANIMATION_HARNESS[assetType]
  return (
    motions.find((preset) => preset.id === motionId) ??
    motions.find((preset) => preset.id === defaultMotionId) ??
    motions[0]
  )
}

/**
 * The action text sent to the provider: identity rules FIRST, then the motion
 * (same idea as `buildPrompt`). `input` is either a preset — used as-is by the
 * offline eval bench (`scripts/pixellab-animate-harness.ts`), which measures
 * the unedited default — or the plain string the Animate tab sends, which is
 * that same default text AFTER the user may have edited it in place (ADR
 * 0012: the preset's `motion` is a prefill, not hidden boilerplate — there is
 * no separate "extra detail" argument to concatenate anymore).
 */
export function buildAnimationAction(input: AnimationMotionPreset | string, assetType: AssetType): string {
  const motion = (typeof input === 'string' ? input : input.motion).trim()
  const { identityRules } = ANIMATION_HARNESS[assetType]
  return motion ? `${identityRules} ${motion}` : identityRules
}
