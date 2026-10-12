import { describe, expect, it } from 'vitest'

import { computeMascotHurtbox, computeMascotSceneState, computeReducedMotionSceneState } from './mascot-scene-state'
import {
  DODGE_CLEARANCE_PX,
  ENEMY_KNOCKBACK_PX,
  GROUND_ENEMY,
  MASCOT_ANIMATION,
  MASCOT_TIMELINE,
  STOP_X,
} from './mascot.constants'

describe('computeMascotSceneState — timeline phases', () => {
  it('starts in run-in, entering from off-screen left, with the level fully drawn', () => {
    const state = computeMascotSceneState(0)
    expect(state.phase).toBe('run-in')
    expect(state.mascotX).toBeLessThan(0)
    expect(state.platformVisible).toBe(true)
    expect(state.levelWipeY).toBeGreaterThan(0)
  })

  it('switches to ground-fight exactly at RUN_IN_END_MS, stopped at STOP_X', () => {
    const justBefore = computeMascotSceneState(MASCOT_TIMELINE.RUN_IN_END_MS - 1)
    expect(justBefore.phase).toBe('run-in')

    const atBoundary = computeMascotSceneState(MASCOT_TIMELINE.RUN_IN_END_MS)
    expect(atBoundary.phase).toBe('ground-fight')
    expect(atBoundary.mascotX).toBe(STOP_X)
  })

  it('walks through every phase, in order, across one loop', () => {
    expect(computeMascotSceneState(MASCOT_TIMELINE.GROUND_FIGHT_END_MS).phase).toBe('jump')
    expect(computeMascotSceneState(MASCOT_TIMELINE.JUMP_END_MS).phase).toBe('air-fight')
    expect(computeMascotSceneState(MASCOT_TIMELINE.AIR_FIGHT_END_MS).phase).toBe('jump-down')
    expect(computeMascotSceneState(MASCOT_TIMELINE.JUMP_DOWN_END_MS).phase).toBe('run-out')
    expect(computeMascotSceneState(MASCOT_TIMELINE.RUN_OUT_END_MS).phase).toBe('title')
  })

  it('loops back to run-in after LOOP_DURATION_MS, with the level fully drawn again', () => {
    const start = computeMascotSceneState(0)
    const afterOneLoop = computeMascotSceneState(MASCOT_TIMELINE.LOOP_DURATION_MS)
    expect(afterOneLoop.phase).toBe(start.phase)
    expect(afterOneLoop.mascotX).toBe(start.mascotX)
    expect(afterOneLoop.levelWipeY).toBe(start.levelWipeY)
  })

  it('lands the up-jump with a 1-frame squash, and the down-jump too', () => {
    expect(computeMascotSceneState(MASCOT_TIMELINE.JUMP_END_MS - 1).squash).toBe(true)
    expect(computeMascotSceneState(MASCOT_TIMELINE.JUMP_DOWN_END_MS - 1).squash).toBe(true)

    const midUpJump = computeMascotSceneState((MASCOT_TIMELINE.GROUND_FIGHT_END_MS + MASCOT_TIMELINE.JUMP_END_MS) / 2)
    expect(midUpJump.squash).toBe(false)
  })

  it('runs out at ground level, not floating at the platform height', () => {
    const runningOut = computeMascotSceneState((MASCOT_TIMELINE.JUMP_DOWN_END_MS + MASCOT_TIMELINE.RUN_OUT_END_MS) / 2)
    const groundFighting = computeMascotSceneState(MASCOT_TIMELINE.RUN_IN_END_MS)
    const onPlatform = computeMascotSceneState(MASCOT_TIMELINE.JUMP_END_MS)
    // Allow 1px for the run-cycle's own ground-bump bob — the point is "ground level", not an exact pixel match.
    expect(Math.abs(runningOut.mascotY - groundFighting.mascotY)).toBeLessThanOrEqual(1)
    expect(runningOut.mascotY).toBeGreaterThan(onPlatform.mascotY)
  })
})

describe('computeMascotSceneState — the level dissolves away for the title, then comes back', () => {
  it('is fully drawn right up to RUN_OUT_END_MS, fully dissolved through the title, and back by the loop end', () => {
    expect(computeMascotSceneState(MASCOT_TIMELINE.RUN_OUT_END_MS - 1).levelWipeY).toBeGreaterThan(0)
    expect(computeMascotSceneState(MASCOT_TIMELINE.DISSOLVE_END_MS).levelWipeY).toBe(0)
    expect(computeMascotSceneState(MASCOT_TIMELINE.TITLE_FADE_END_MS).levelWipeY).toBe(0)
    expect(computeMascotSceneState(MASCOT_TIMELINE.LEVEL_FADE_IN_END_MS).levelWipeY).toBeGreaterThan(0)
  })
})

describe('computeMascotSceneState — ground fight (enemy shoots back, mascot dodges)', () => {
  it('fires an enemy bolt that flies past, never stopping at the mascot', () => {
    const duringEnemyShot = computeMascotSceneState(MASCOT_TIMELINE.GROUND_ENEMY_BOLT_SHOOT_MS)
    expect(duringEnemyShot.enemyBolt.visible).toBe(true)

    const afterGone = computeMascotSceneState(MASCOT_TIMELINE.GROUND_ENEMY_BOLT_GONE_MS)
    expect(afterGone.enemyBolt.visible).toBe(false)
  })

  it('crouches while the bolt is in flight', () => {
    const crouching = computeMascotSceneState(MASCOT_TIMELINE.GROUND_CROUCH_START_MS + 10)
    expect(crouching.pose).toBe('crouch')

    const beforeCrouch = computeMascotSceneState(MASCOT_TIMELINE.GROUND_CROUCH_START_MS - 10)
    expect(beforeCrouch.pose).not.toBe('crouch')
  })

  it('fires back and kills the enemy: hit-stop flash + knockback, then a particle burst, then gone for good', () => {
    const atHit = computeMascotSceneState(MASCOT_TIMELINE.GROUND_PLAYER_HIT_MS)
    const groundAtHit = atHit.enemies.find((enemy) => enemy.kind === 'ground')
    expect(groundAtHit?.lifecycle).toBe('hit')
    expect(groundAtHit?.x).toBe(GROUND_ENEMY.X + ENEMY_KNOCKBACK_PX)

    const justAfterHitStop = computeMascotSceneState(
      MASCOT_TIMELINE.GROUND_PLAYER_HIT_MS + MASCOT_ANIMATION.FRAME_DURATION_MS * MASCOT_ANIMATION.HIT_STOP_FRAMES + 10,
    )
    const bursting = justAfterHitStop.enemies.find((enemy) => enemy.kind === 'ground')
    expect(bursting?.lifecycle).toBe('bursting')
    expect(bursting?.burstProgress).toBeGreaterThan(0)

    const longAfter = computeMascotSceneState(MASCOT_TIMELINE.GROUND_FIGHT_END_MS - 1)
    expect(longAfter.enemies.find((enemy) => enemy.kind === 'ground')?.lifecycle).toBe('gone')
  })
})

describe('computeMascotSceneState — air fight (drone shoots back, mascot dodges)', () => {
  it('is idling on the platform from the very start of the loop — not spawning later', () => {
    const atStart = computeMascotSceneState(0)
    expect(atStart.enemies.find((enemy) => enemy.kind === 'air')?.lifecycle).toBe('alive')
  })

  it('fires a bolt the mascot hops to dodge, then aims and fires back', () => {
    const duringEnemyShot = computeMascotSceneState(MASCOT_TIMELINE.AIR_ENEMY_BOLT_SHOOT_MS)
    expect(duringEnemyShot.enemyBolt.visible).toBe(true)

    const dodging = computeMascotSceneState(MASCOT_TIMELINE.AIR_DODGE_HOLD_END_MS - 10)
    expect(dodging.pose).toBe('jump')
    expect(dodging.mascotY).toBeLessThan(computeMascotSceneState(MASCOT_TIMELINE.AIR_FIGHT_END_MS - 1).mascotY)

    const aiming = computeMascotSceneState(MASCOT_TIMELINE.AIR_AIM_MS + 10)
    expect(aiming.aim).toBe('up')

    const atKill = computeMascotSceneState(MASCOT_TIMELINE.AIR_PLAYER_HIT_MS)
    expect(atKill.enemies.find((enemy) => enemy.kind === 'air')?.lifecycle).toBe('hit')
  })
})

describe('computeMascotSceneState — enemy bolts never overlap the mascot (dodge must actually clear it)', () => {
  it('keeps at least DODGE_CLEARANCE_PX between every visible enemy bolt and the mascot hurtbox, across the whole loop', () => {
    const violations: string[] = []
    const SAMPLE_STEP_MS = 2

    for (let t = 0; t < MASCOT_TIMELINE.LOOP_DURATION_MS; t += SAMPLE_STEP_MS) {
      const state = computeMascotSceneState(t)
      if (!state.enemyBolt.visible) continue

      const hurtbox = computeMascotHurtbox(state.pose, state.mascotX, state.mascotY)
      const boltLeft = state.enemyBolt.x
      const boltRight = state.enemyBolt.x + 2 // bolts are drawn 2px wide, see `drawBolt`
      const boltTop = state.enemyBolt.y
      const boltBottom = state.enemyBolt.y + 1 // 1px tall

      const overlapsX = boltLeft < hurtbox.x + hurtbox.w && boltRight > hurtbox.x
      const overlapsY = boltTop < hurtbox.y + hurtbox.h && boltBottom > hurtbox.y
      if (overlapsX && overlapsY) {
        violations.push(`t=${t}ms pose=${state.pose} bolt=(${boltLeft.toFixed(1)},${boltTop.toFixed(1)}) hurtbox=(${hurtbox.x},${hurtbox.y},${hurtbox.w}x${hurtbox.h})`)
        continue
      }

      // Also require the configured clearance, not just "doesn't overlap" — a graze isn't a real dodge.
      if (overlapsX) {
        const verticalGap = boltTop >= hurtbox.y + hurtbox.h ? boltTop - (hurtbox.y + hurtbox.h) : hurtbox.y - boltBottom
        if (verticalGap < DODGE_CLEARANCE_PX) {
          violations.push(`t=${t}ms clearance=${verticalGap.toFixed(2)}px < ${DODGE_CLEARANCE_PX}px`)
        }
      }
    }

    expect(violations).toEqual([])
  })
})

describe('computeMascotSceneState — title card ("PIXELFORGE" then "AI")', () => {
  it('stays empty until the level has fully dissolved', () => {
    const duringDissolve = computeMascotSceneState(MASCOT_TIMELINE.RUN_OUT_END_MS + 10)
    expect(duringDissolve.titleLetters.every((letter) => letter.opacity === 0)).toBe(true)
  })

  it('drops PIXELFORGE in first, AI only after it has finished', () => {
    const justRevealed = computeMascotSceneState(MASCOT_TIMELINE.DISSOLVE_END_MS + 5)
    expect(justRevealed.titleLetters[0]?.opacity).toBeGreaterThan(0)
    expect(justRevealed.subtitleLetters.every((letter) => letter.opacity === 0)).toBe(true)
  })

  it('eventually shows AI too, and both hold fully visible, then fade together', () => {
    const held = computeMascotSceneState(MASCOT_TIMELINE.TITLE_HOLD_END_MS - 50)
    expect(held.titleLetters.every((letter) => letter.opacity === 1)).toBe(true)
    expect(held.subtitleLetters.every((letter) => letter.opacity === 1)).toBe(true)

    const faded = computeMascotSceneState(MASCOT_TIMELINE.TITLE_FADE_END_MS - 1)
    expect(faded.titleLetters.every((letter) => letter.opacity < 1)).toBe(true)
    expect(faded.subtitleLetters.every((letter) => letter.opacity < 1)).toBe(true)
  })
})

describe('computeMascotHurtbox', () => {
  it('shrinks from the top when crouching, feet edge unchanged', () => {
    const standing = computeMascotHurtbox('idle', 10, 20)
    const crouching = computeMascotHurtbox('crouch', 10, 20)
    expect(standing).toEqual({ x: 10, y: 20, w: 16, h: 16 })
    expect(crouching.y).toBeGreaterThan(standing.y)
    expect(crouching.y + crouching.h).toBe(standing.y + standing.h)
  })
})

describe('computeReducedMotionSceneState', () => {
  it('composes one still frame: shooting the drone over the fully-visible city, no logo', () => {
    const state = computeReducedMotionSceneState()
    expect(state.aim).toBe('up')
    expect(state.platformVisible).toBe(true)
    expect(state.levelWipeY).toBeGreaterThan(0)
    expect(state.enemies.find((enemy) => enemy.kind === 'air')?.lifecycle).toBe('alive')
    expect(state.titleLetters).toHaveLength(0)
    expect(state.subtitleLetters).toHaveLength(0)
  })
})
