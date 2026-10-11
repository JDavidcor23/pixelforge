interface KeyChipProps {
  label: string
}

/** Decorative key hint; the owning control carries `aria-keyshortcuts`. */
export function KeyChip({ label }: KeyChipProps) {
  return (
    <kbd
      aria-hidden
      className="rounded-xs border border-line-strong px-1.25 py-px font-mono text-3xs text-muted"
    >
      {label}
    </kbd>
  )
}
