import { AssetFolderTree } from '../AssetFolderTree/AssetFolderTree'
import { AssetGrid } from '../AssetGrid/AssetGrid'
import { useAssetsPanel } from './useAssetsPanel.hook'

interface AssetsPanelProps {
  readonly search: string
}

export const AssetsPanel = ({ search }: AssetsPanelProps) => {
  const {
    folders,
    selectedFolderId,
    folderCounts,
    handleSelectFolder,
    filteredItems,
    selectedFolderLabel,
    isApplying,
    handleSelectItem,
    handleDownloadItem,
    handleDownloadSource,
    handleOpenCreate,
  } = useAssetsPanel({ search })

  return (
    <div className="flex h-full min-h-0 w-full">
      <AssetFolderTree
        folders={folders}
        selectedFolderId={selectedFolderId}
        folderCounts={folderCounts}
        onSelectFolder={handleSelectFolder}
      />
      <AssetGrid
        folderLabel={selectedFolderLabel}
        items={filteredItems}
        search={search}
        isApplying={isApplying}
        onSelectItem={handleSelectItem}
        onDownloadItem={handleDownloadItem}
        onDownloadSource={handleDownloadSource}
        onOpenCreate={handleOpenCreate}
      />
    </div>
  )
}
