import { UNTITLED_ASSET_NAME_PREFIX } from '@/constants'

const UNTITLED_NAME_PATTERN = new RegExp(`^${UNTITLED_ASSET_NAME_PREFIX} ([1-9]\\d*)$`)

/**
 * ADR 0015: the name of a new editor-made sprite — "Untitled N", where N is
 * one more than the highest "Untitled N" already in `takenNames`, so a
 * deleted number is never handed out again while a higher one exists.
 */
export const nextUntitledName = (takenNames: readonly string[]): string => {
  const highest = takenNames.reduce((max, name) => {
    const match = UNTITLED_NAME_PATTERN.exec(name)
    return match ? Math.max(max, Number(match[1])) : max
  }, 0)
  return `${UNTITLED_ASSET_NAME_PREFIX} ${highest + 1}`
}
