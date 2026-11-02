import { LEVEL_FORMAT } from '@/constants/build-game'
import type { Level, LevelPoint, LevelRect, LevelResult } from '../types'

/** Thrown inside the parser only; `parseLevel` turns it into `{ ok: false }`. */
class LevelError extends Error {}

type Fields = Record<string, unknown>

function fail(message: string): never {
  throw new LevelError(message)
}

function isObject(value: unknown): value is Fields {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
}

function readObject(value: unknown, path: string): Fields {
  return isObject(value) ? value : fail(`${path} must be an object`)
}

function readNumber(fields: Fields, key: string, path: string): number {
  const value = fields[key]
  return typeof value === 'number' && Number.isFinite(value) ? value : fail(`${path}.${key} must be a number`)
}

function readPositive(fields: Fields, key: string, path: string): number {
  const value = fields[key]
  return typeof value === 'number' && Number.isFinite(value) && value > 0
    ? value
    : fail(`${path ? `${path}.` : ''}${key} must be a positive number`)
}

function readPoint(value: unknown, path: string): LevelPoint {
  const fields = readObject(value, path)
  return { x: readNumber(fields, 'x', path), y: readNumber(fields, 'y', path) }
}

function readRect(value: unknown, path: string): LevelRect {
  const fields = readObject(value, path)
  return {
    x: readNumber(fields, 'x', path),
    y: readNumber(fields, 'y', path),
    width: readPositive(fields, 'width', path),
    height: readPositive(fields, 'height', path),
  }
}

function readRects(value: unknown, path: string, { required }: { required: boolean }): LevelRect[] {
  if (!Array.isArray(value)) fail(`${path} must be a list`)
  if (required && value.length === 0) fail(`${path} must have at least one item`)
  return value.map((item, index) => readRect(item, `${path}[${index}]`))
}

/** Rejects a box or point that does not fit inside the level, so nothing spawns or waits off-world. */
function assertInside(level: Pick<Level, 'width' | 'height'>, box: LevelPoint & Partial<LevelRect>, path: string) {
  const right = box.x + (box.width ?? 0)
  const bottom = box.y + (box.height ?? 0)
  if (box.x < 0 || box.y < 0 || right > level.width || bottom > level.height) {
    fail(`${path} must be inside the ${level.width}x${level.height} level`)
  }
}

function readLevel(input: unknown): Level {
  if (!isObject(input)) fail('level must be an object')
  if (input.version !== LEVEL_FORMAT.VERSION) fail(`version must be ${LEVEL_FORMAT.VERSION}`)
  if (typeof input.name !== 'string' || input.name.trim() === '') fail('name must be a non-empty string')

  const width = readPositive(input, 'width', '')
  const height = readPositive(input, 'height', '')
  const spawn = readPoint(input.spawn, 'spawn')
  const platforms = readRects(input.platforms, 'platforms', { required: true })
  const hazards = readRects(input.hazards, 'hazards', { required: false })
  const goal = readRect(input.goal, 'goal')

  const size = { width, height }
  assertInside(size, spawn, 'spawn')
  assertInside(size, goal, 'goal')

  return { version: LEVEL_FORMAT.VERSION, name: input.name, width, height, spawn, platforms, hazards, goal }
}

/** Validates untrusted level JSON. Errors name the exact field so a broken level file is easy to fix. */
export function parseLevel(input: unknown): LevelResult {
  try {
    return { ok: true, level: readLevel(input) }
  } catch (error) {
    if (error instanceof LevelError) return { ok: false, error: `Invalid level: ${error.message}` }
    throw error
  }
}
