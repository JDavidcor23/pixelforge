import type { LucideIcon } from 'lucide-react'

interface BuildEmptyStateProps {
  icon: LucideIcon
  title: string
  hint: string
}

export function BuildEmptyState({ icon: Icon, title, hint }: BuildEmptyStateProps) {
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-2 p-4 text-center">
      <Icon className="size-5 text-subtle" aria-hidden />
      <p className="text-ui text-muted">{title}</p>
      <p className="text-2xs text-subtle">{hint}</p>
    </div>
  )
}
