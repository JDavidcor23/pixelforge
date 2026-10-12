import type { PixelWriter } from '@/types'
import {
  CITY,
  CITY_FAR_BUILDINGS,
  CITY_GEOMETRY,
  CITY_NEAR_BUILDINGS,
  GROUND_Y,
  MASCOT_COLORS,
  MASCOT_SCENE_SIZE,
} from './mascot.constants'

const { WIDTH: SCENE_WIDTH } = MASCOT_SCENE_SIZE

/**
 * Tiny deterministic hash (mulberry32's mixing step, single-shot) — `seed`
 * in, a stable pseudo-random `[0, 1)` out. No `Math.random()` anywhere in
 * the background: the whole scene stays a pure function of elapsed time, so
 * it's reproducible in tests and never desyncs on re-render.
 */
function hashSeed(seed: number): number {
  let t = seed + 0x6d2b79f5
  t = Math.imul(t ^ (t >>> 15), t | 1)
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296
}

/**
 * One window's lit/unlit state for the `elapsedMs` bucket it falls in
 * (`CITY.WINDOW_BLINK_BUCKET_MS` wide) — re-rolled, deterministically, each
 * time a new bucket starts. Exported for `mascot-city.test.ts`.
 */
export function isWindowLit(seed: number, elapsedMs: number): boolean {
  const bucket = Math.floor(elapsedMs / CITY.WINDOW_BLINK_BUCKET_MS)
  return hashSeed(seed * 97 + bucket) > 0.5
}

function drawBuildingWindows(writer: PixelWriter, x: number, y: number, w: number, h: number, seedBase: number, elapsedMs: number, color: string): void {
  let windowIndex = 0
  for (let wy = y + 2; wy <= y + h - 2; wy += 3) {
    for (let wx = x + 1; wx <= x + w - 2; wx += 3) {
      if (isWindowLit(seedBase + windowIndex, elapsedMs)) writer.fillRect(wx, wy, 1, 1, color)
      windowIndex++
    }
  }
}

function drawBuildingLayer(
  writer: PixelWriter,
  buildings: readonly (readonly [number, number, number])[],
  tile: number,
  bodyColor: string,
  scrollPxPerSec: number,
  elapsedMs: number,
  seedLayer: number,
  windowColor: string,
): void {
  const scrollPx = (elapsedMs / 1000) * scrollPxPerSec
  const offset = Math.floor(scrollPx) % tile
  for (let tileX = -tile - offset; tileX < SCENE_WIDTH + tile; tileX += tile) {
    buildings.forEach(([bx, bw, bh], index) => {
      const x = tileX + bx
      const y = GROUND_Y - bh
      writer.fillRect(x, y, bw, bh, bodyColor)
      drawBuildingWindows(writer, x, y, bw, bh, seedLayer + index * 31 + Math.round(tileX), elapsedMs, windowColor)
    })
  }
}

/** One plane per `CITY.PLANE_CYCLE_MS` cycle, crossing for `CITY.PLANE_CROSS_DURATION_MS` then absent for the rest — guarantees at most one in the sky at any time. Exported for `mascot-city.test.ts`. */
export function computePlanePosition(elapsedMs: number): { readonly x: number; readonly y: number } | null {
  const cycleElapsedMs = elapsedMs % CITY.PLANE_CYCLE_MS
  if (cycleElapsedMs >= CITY.PLANE_CROSS_DURATION_MS) return null
  const t = cycleElapsedMs / CITY.PLANE_CROSS_DURATION_MS
  const x = -10 + t * (SCENE_WIDTH + 20)
  const y = 6 + Math.sin(t * Math.PI) * 2
  return { x, y }
}

function drawPlane(writer: PixelWriter, elapsedMs: number): void {
  const plane = computePlanePosition(elapsedMs)
  if (!plane) return
  const x = Math.round(plane.x)
  const y = Math.round(plane.y)
  writer.fillRect(x - 3, y, 2, 1, MASCOT_COLORS.PLANE_TRAIL)
  writer.fillRect(x, y, 4, 1, MASCOT_COLORS.PLANE_BODY)
  writer.fillRect(x + 1, y - 1, 2, 1, MASCOT_COLORS.PLANE_BODY)
  if (Math.floor(elapsedMs / CITY.PLANE_BLINK_MS) % 2 === 0) writer.fillRect(x + 4, y, 1, 1, MASCOT_COLORS.PLANE_LIGHT)
}

/** 3 cheap "rotation" frames for a small drifting shape — a filled square, then its two diagonals. */
const GEOMETRY_SHAPES: readonly (readonly (readonly [number, number])[])[] = [
  [
    [0, 0],
    [1, 0],
    [0, 1],
    [1, 1],
  ],
  [
    [0, 0],
    [1, 1],
  ],
  [
    [1, 0],
    [0, 1],
  ],
]

function drawGeometry(writer: PixelWriter, elapsedMs: number, frame: number): void {
  for (const [xBase, yBase, seed] of CITY_GEOMETRY) {
    const driftX = Math.sin(elapsedMs / 4000 + seed) * 3
    const driftY = Math.cos(elapsedMs / 5000 + seed) * 2
    const shape = GEOMETRY_SHAPES[(frame + seed) % GEOMETRY_SHAPES.length]
    const x = Math.round(xBase + driftX)
    const y = Math.round(yBase + driftY)
    for (const [dx, dy] of shape) writer.fillRect(x + dx, y + dy, 1, 1, MASCOT_COLORS.GEOMETRY)
  }
}

/**
 * The "living background": far + near parallax city layers (blinking
 * windows, seeded not random), an occasional plane, and a few drifting
 * geometry shapes. Pure — a function of `elapsedMs`/`frame` only — so it's
 * trivially testable and stays in lockstep with the rest of the scene.
 */
export function drawCityBackground(writer: PixelWriter, elapsedMs: number, frame: number): void {
  drawGeometry(writer, elapsedMs, frame)
  drawBuildingLayer(writer, CITY_FAR_BUILDINGS, CITY.FAR_TILE, MASCOT_COLORS.CITY_FAR, CITY.FAR_SCROLL_PX_PER_SEC, elapsedMs, 1000, MASCOT_COLORS.WINDOW_LIT_FAR)
  drawPlane(writer, elapsedMs)
  drawBuildingLayer(writer, CITY_NEAR_BUILDINGS, CITY.NEAR_TILE, MASCOT_COLORS.CITY_NEAR, CITY.NEAR_SCROLL_PX_PER_SEC, elapsedMs, 2000, MASCOT_COLORS.WINDOW_LIT_NEAR)
}
