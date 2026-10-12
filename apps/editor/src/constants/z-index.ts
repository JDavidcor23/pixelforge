/**
 * Centralized stacking order (Tailwind class strings — same pattern as
 * `FOCUS_RING`/`MOTION`: the literal strings below are what Tailwind's
 * content scanner picks up, so `z-[100]` still compiles even though it
 * appears nowhere else).
 *
 * Found via a real bug: `SpriteEditorLayout`'s rail-collapse handles sat at
 * `z-[60]`, numerically ABOVE `SettingsPanel`'s `z-50` backdrop, so they
 * rendered on top of an open modal. Position in the DOM never mattered —
 * only the z-index number did, since none of the intervening ancestors form
 * their own stacking context.
 *
 * - `HANDLE`: in-layout resize handles and collapsed-rail toggle chevrons —
 *   always the lowest layer so neither a popover nor a modal can ever be
 *   covered by one.
 * - `POPOVER`: in-layout dropdowns/menus anchored to a trigger (TopBar
 *   export menu, AccountMenu, canvas-size picker). Unchanged numeric value
 *   (50) from before this fix — only now it has a name.
 * - `MODAL`: full-viewport dialogs. Rendered through `ModalPortal` straight
 *   onto `document.body` AND given the highest z-index, so no in-layout
 *   z-index — now or added later — can ever outrank one again.
 */
export const Z_INDEX = {
  HANDLE: 'z-10',
  POPOVER: 'z-50',
  MODAL: 'z-[100]',
} as const
