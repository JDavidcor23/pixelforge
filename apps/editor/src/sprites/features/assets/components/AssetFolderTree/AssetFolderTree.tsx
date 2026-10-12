import { Box, Folder, Shirt, Sparkles, Sword, User } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'

import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import type { ASSET_FOLDERS } from '@/constants'
import type { AssetType } from '@/types'

const ICON_MAP: Record<string, LucideIcon> = { Folder, User, Box, Sword, Shirt, Sparkles }

interface AssetFolderTreeProps {
  readonly folders: typeof ASSET_FOLDERS
  readonly selectedFolderId: 'all' | AssetType
  readonly folderCounts: Partial<Record<'all' | AssetType, number>>
  readonly onSelectFolder: (folderId: 'all' | AssetType) => void
}

export const AssetFolderTree = ({
  folders,
  selectedFolderId,
  folderCounts,
  onSelectFolder,
}: AssetFolderTreeProps) => {
  return (
    <nav aria-label="Asset folders" className="flex w-55 shrink-0 flex-col gap-0.5 border-r border-line p-2">
      {folders.map((folder) => {
        const Icon = ICON_MAP[folder.iconName]
        const isActive = folder.id === selectedFolderId

        return (
          <button
            key={folder.id}
            type="button"
            onClick={() => onSelectFolder(folder.id)}
            aria-current={isActive}
            className={`flex h-7 items-center gap-2 rounded px-2 text-xs ${MOTION.COLORS} ${FOCUS_RING.SURFACE} ${
              isActive ? 'bg-hover text-ink' : 'text-muted hover:bg-hover hover:text-ink'
            }`}
          >
            {Icon && <Icon size={12} className={isActive ? 'text-accent' : 'text-subtle'} aria-hidden />}
            <span className="truncate">{folder.label}</span>
            <span className="flex-1" />
            <span className="font-mono text-3xs text-subtle">{folderCounts[folder.id] ?? 0}</span>
          </button>
        )
      })}
    </nav>
  )
}
