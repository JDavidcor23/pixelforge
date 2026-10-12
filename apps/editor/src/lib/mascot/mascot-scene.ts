import { hexToRgba, rgbaToString } from '@/lib/color-utils'
import type { EnemyState, MascotSceneState, PixelWriter } from '@/types'
import { drawCityBackground } from './mascot-city'
import { drawGlyphText } from './mascot-font'
import { drawMascot } from './mascot-sprite'
import {
  AIR_ENEMY,
  GROUND_ENEMY,
  MASCOT_COLORS,
  PARTICLE_BURST,
  PARTICLE_GRAVITY,
  PARTICLE_SPREAD_PX,
  PLATFORM,
  PLATFORM_Y,
  SQUASH_OFFSET_PX,
  SUBTITLE_BASELINE_Y,
  TITLE_BASELINE_Y,
} from './mascot.constants'

/** Wraps a `PixelWriter` so every call is drawn relative to `(dx, dy)` — lets the mascot be positioned without `drawMascot` knowing about scene layout. */
function withOffset(writer: PixelWriter, dx: number, dy: number): PixelWriter {
  return {
    fillRect(x, y, w, h, color) {
      writer.fillRect(x + dx, y + dy, w, h, color)
    },
  }
}

/** Clips every `fillRect` to `y < maxY` — the scanline wipe that dissolves/reveals the level around the title card (`state.levelWipeY`). */
function withMaxY(writer: PixelWriter, maxY: number): PixelWriter {
  return {
    fillRect(x, y, w, h, color) {
      if (y >= maxY) return
      const clippedHeight = Math.min(h, maxY - y)
      if (clippedHeight <= 0) return
      writer.fillRect(x, y, w, clippedHeight, color)
    },
  }
}

function enemySize(kind: EnemyState['kind']): { readonly width: number; readonly height: number } {
  return kind === 'ground'
    ? { width: GROUND_ENEMY.WIDTH, height: GROUND_ENEMY.HEIGHT }
    : { width: AIR_ENEMY.WIDTH, height: AIR_ENEMY.HEIGHT }
}

/** Ground enemy — a little walker bot: body, 1px outline, two bright eyes, a mouth/visor slit, tiny alternating legs (2-frame walk), and a muzzle nub facing the mascot. */
function drawGroundEnemy(writer: PixelWriter, x: number, y: number, frame: number): void {
  const { width, height } = enemySize('ground')
  writer.fillRect(x + 1, y, width - 2, height - 1, MASCOT_COLORS.ENEMY_BODY)
  writer.fillRect(x + 1, y, width - 2, 1, MASCOT_COLORS.ENEMY_OUTLINE)
  writer.fillRect(x + 1, y + height - 2, width - 2, 1, MASCOT_COLORS.ENEMY_OUTLINE)
  writer.fillRect(x, y + 1, 1, height - 2, MASCOT_COLORS.ENEMY_OUTLINE)
  writer.fillRect(x + width - 1, y + 1, 1, height - 2, MASCOT_COLORS.ENEMY_OUTLINE)

  // Eyes + visor slit.
  writer.fillRect(x + 2, y + 2, 1, 1, MASCOT_COLORS.ENEMY_EYE)
  writer.fillRect(x + width - 3, y + 2, 1, 1, MASCOT_COLORS.ENEMY_EYE)
  writer.fillRect(x + 2, y + height - 3, width - 4, 1, MASCOT_COLORS.ENEMY_OUTLINE)

  // Tiny legs — alternate which one touches down, a 2-frame walk cycle.
  const leftDown = frame % 2 === 0
  writer.fillRect(x + 1, y + height - 1, 1, 1, leftDown ? MASCOT_COLORS.ENEMY_OUTLINE : MASCOT_COLORS.ENEMY_BODY)
  writer.fillRect(x + width - 2, y + height - 1, 1, 1, leftDown ? MASCOT_COLORS.ENEMY_BODY : MASCOT_COLORS.ENEMY_OUTLINE)

  // Gun muzzle, facing the mascot (to its left).
  writer.fillRect(x - 1, y + Math.floor(height / 2) - 1, 1, 1, MASCOT_COLORS.ENEMY_OUTLINE)
}

/** Flying drone — metal body, outline, a 3-frame spinning rotor on top, a blinking red threat-light, and a small gun underneath. */
function drawAirEnemy(writer: PixelWriter, x: number, y: number, frame: number): void {
  const { width, height } = enemySize('air')
  writer.fillRect(x + 2, y + 2, width - 4, height - 3, MASCOT_COLORS.ENEMY_BODY_AIR)
  writer.fillRect(x + 2, y + 1, width - 4, 1, MASCOT_COLORS.ENEMY_OUTLINE)
  writer.fillRect(x + 2, y + height - 1, width - 4, 1, MASCOT_COLORS.ENEMY_OUTLINE)
  writer.fillRect(x + 1, y + 2, 1, height - 3, MASCOT_COLORS.ENEMY_OUTLINE)
  writer.fillRect(x + width - 2, y + 2, 1, height - 3, MASCOT_COLORS.ENEMY_OUTLINE)

  // Spinning rotor bar on top — 3-frame cycle (full bar, then two narrower "blur" widths).
  const rotorFrame = frame % 3
  const rotorInset = rotorFrame === 0 ? 0 : 1
  writer.fillRect(x + 1 + rotorInset, y, width - 2 - rotorInset * 2, 1, MASCOT_COLORS.ENEMY_OUTLINE)

  // Blinking red/orange threat-light.
  if (frame % 6 < 3) writer.fillRect(x + width / 2 - 1, y + 3, 2, 1, MASCOT_COLORS.ENEMY_EYE_AIR)

  // Small gun underneath.
  writer.fillRect(x + width / 2 - 1, y + height, 2, 1, MASCOT_COLORS.ENEMY_OUTLINE)
}

function drawEnemyHit(writer: PixelWriter, enemy: EnemyState): void {
  const { width, height } = enemySize(enemy.kind)
  writer.fillRect(enemy.x, enemy.y, width, height, MASCOT_COLORS.HIT_FLASH)
}

/** Fading, outward-flying pixels from a fixed (deterministic) burst template — see `PARTICLE_BURST`. */
function drawParticleBurst(writer: PixelWriter, originX: number, originY: number, progress: number): void {
  const color = rgbaToString({ ...hexToRgba(MASCOT_COLORS.PARTICLE), a: Math.round((1 - progress) * 255) })
  for (const [vx, vy] of PARTICLE_BURST) {
    const x = Math.round(originX + vx * progress * PARTICLE_SPREAD_PX)
    const y = Math.round(originY + vy * progress * PARTICLE_SPREAD_PX + PARTICLE_GRAVITY * progress * progress)
    writer.fillRect(x, y, 1, 1, color)
  }
}

function drawEnemy(writer: PixelWriter, enemy: EnemyState, frame: number): void {
  if (enemy.lifecycle === 'alive' || enemy.lifecycle === 'hit') {
    if (enemy.lifecycle === 'hit') {
      drawEnemyHit(writer, enemy)
      return
    }
    if (enemy.kind === 'ground') drawGroundEnemy(writer, enemy.x, enemy.y, frame)
    else drawAirEnemy(writer, enemy.x, enemy.y, frame)
    return
  }
  if (enemy.lifecycle === 'bursting') {
    const { width, height } = enemySize(enemy.kind)
    drawParticleBurst(writer, enemy.x + width / 2, enemy.y + height / 2, enemy.burstProgress)
  }
}

function drawPlatform(writer: PixelWriter): void {
  writer.fillRect(PLATFORM.X, PLATFORM_Y, PLATFORM.WIDTH, 1, MASCOT_COLORS.PLATFORM_EDGE)
  writer.fillRect(PLATFORM.X, PLATFORM_Y + 1, PLATFORM.WIDTH, PLATFORM.HEIGHT - 1, MASCOT_COLORS.PLATFORM)
}

function drawBolt(writer: PixelWriter, bolt: MascotSceneState['playerBolt'], color: string): void {
  if (!bolt.visible) return
  const x = Math.round(bolt.x)
  const y = Math.round(bolt.y)
  if (bolt.muzzleFlash) writer.fillRect(x - 1, y - 1, 3, 3, MASCOT_COLORS.MUZZLE_FLASH)
  writer.fillRect(x, y, 2, 1, color)
}

/**
 * Composes one frame of the looping "run and shoot" cutscene — living city
 * background, platform, enemies/particles, both sides' blaster bolts,
 * mascot, and the "PIXELFORGE" / "AI" title card — from one animation tick
 * (`computeMascotSceneState`). Pure: all it needs is a `PixelWriter` (a real
 * `CanvasRenderingContext2D` via `createCanvas2DPixelWriter`, or a fake
 * recorder in tests). Draws nothing for a solid background — the canvas
 * stays transparent, over the page's own grid/glow (see
 * `useMascotScene.hook.ts`, which clears instead of filling).
 */
export function drawMascotScene(writer: PixelWriter, state: MascotSceneState): void {
  // The level (city + platform) scanline-wipes away around the title card — see `state.levelWipeY`.
  const levelWriter = withMaxY(writer, state.levelWipeY)
  drawCityBackground(levelWriter, state.elapsedMs, state.frame)
  if (state.platformVisible) drawPlatform(levelWriter)

  for (const enemy of state.enemies) drawEnemy(writer, enemy, state.frame)

  drawBolt(writer, state.enemyBolt, MASCOT_COLORS.ENEMY_BOLT)
  drawBolt(writer, state.playerBolt, MASCOT_COLORS.BOLT)

  const mascotY = state.mascotY + (state.squash ? SQUASH_OFFSET_PX : 0)
  const mascotWriter = withOffset(writer, state.mascotX, mascotY)
  drawMascot(mascotWriter, { pose: state.pose, blink: state.blink, aim: state.aim })

  drawGlyphText(writer, state.titleLetters, TITLE_BASELINE_Y, { color: MASCOT_COLORS.GLYPH, glow: true })
  drawGlyphText(writer, state.subtitleLetters, SUBTITLE_BASELINE_Y, { color: MASCOT_COLORS.GLYPH_SUBTITLE })
}
