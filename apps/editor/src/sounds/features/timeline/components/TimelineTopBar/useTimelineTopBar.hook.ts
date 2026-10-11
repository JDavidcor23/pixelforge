import { useCallback, useEffect, useRef, useState } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { selectCanRedo, selectCanUndo } from '@/stores/selectors/sound-timeline.selectors'
import { useMixExport } from '../../hooks/useMixExport.hook'
import { useModKeyLabel } from '../../hooks/useModKeyLabel.hook'
import { SOUND_NAME_MAX_LENGTH } from '@/constants/sound-library'
import { SAVE_STATUS } from '@/constants/timeline-view'

export function useTimelineTopBar() {
  const renameButtonRef = useRef<HTMLButtonElement>(null)
  const wasRenamingRef = useRef(false)
  // Escape unmounts the input; the trailing blur must not save the draft.
  const isCancellingRef = useRef(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [draftName, setDraftName] = useState('')

  const projectName = useSoundsStore((state) => state.projectName)
  const setProjectName = useSoundsStore((state) => state.setProjectName)
  const canUndo = useSoundsStore(selectCanUndo)
  const canRedo = useSoundsStore(selectCanRedo)
  const undo = useSoundsStore((state) => state.undo)
  const redo = useSoundsStore((state) => state.redo)
  const { modLabel } = useModKeyLabel()
  const { isExporting, exportError, canExport, handleExport } = useMixExport()

  // Hand focus back to the pencil once the inline input goes away.
  useEffect(() => {
    if (wasRenamingRef.current && !isRenaming) renameButtonRef.current?.focus()
    wasRenamingRef.current = isRenaming
  }, [isRenaming])

  const handleStartRename = useCallback(() => {
    isCancellingRef.current = false
    setDraftName(projectName)
    setIsRenaming(true)
  }, [projectName])

  const handleDraftChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => setDraftName(event.target.value),
    []
  )

  const commitRename = useCallback(() => {
    if (isCancellingRef.current) return
    setProjectName(draftName)
    setIsRenaming(false)
  }, [draftName, setProjectName])

  const handleRenameKeyDown = useCallback(
    (event: React.KeyboardEvent<HTMLInputElement>) => {
      if (event.key === 'Enter') {
        event.preventDefault()
        commitRename()
      } else if (event.key === 'Escape') {
        event.preventDefault()
        isCancellingRef.current = true
        setIsRenaming(false)
      }
    },
    [commitRename]
  )

  const handleRenameFocus = useCallback(
    (event: React.FocusEvent<HTMLInputElement>) => event.target.select(),
    []
  )

  return {
    renameButtonRef,
    projectName,
    isRenaming,
    draftName,
    nameMaxLength: SOUND_NAME_MAX_LENGTH,
    saveStatus: SAVE_STATUS,
    canUndo,
    canRedo,
    undoTitle: `Undo (${modLabel}+Z)`,
    redoTitle: `Redo (${modLabel}+Shift+Z)`,
    isExporting,
    exportError,
    canExport,
    handleStartRename,
    handleDraftChange,
    handleRenameKeyDown,
    handleRenameFocus,
    handleRenameBlur: commitRename,
    handleUndo: undo,
    handleRedo: redo,
    handleExport,
  }
}
