import { parseLevel } from './parse-level'
import type { LevelResult } from '../types'

type FetchLevel = (url: string) => Promise<Pick<Response, 'ok' | 'status' | 'json'>>

/** Fetches a level file and validates it; never throws for a bad file or a failed request. */
export async function loadLevel(url: string, fetchFn: FetchLevel = fetch): Promise<LevelResult> {
  const response = await fetchFn(url)
  if (!response.ok) return { ok: false, error: `Could not load level ${url} (HTTP ${response.status})` }

  let body: unknown
  try {
    body = await response.json()
  } catch {
    return { ok: false, error: `Could not load level ${url} (not valid JSON)` }
  }

  return parseLevel(body)
}
