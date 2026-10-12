/**
 * TopBar's visible save-status indicator (Sprite Studio v2 batch 4) — a
 * presentation-ready projection of `SaveStatus` + `isPersistent` (see
 * `useTopBar.hook.ts`). `'saving'` carries no title: it is a transient
 * state, never worth a tooltip.
 */
export type SaveIndicator =
  | { readonly kind: 'saving' }
  | { readonly kind: 'saved'; readonly title: string }
  | { readonly kind: 'not-saved'; readonly title: string }
