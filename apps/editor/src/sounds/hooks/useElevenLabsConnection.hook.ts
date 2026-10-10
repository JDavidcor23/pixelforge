import { useEditorUIStore } from '@/stores/ui.store'
import { getElevenLabsApiKey } from '@/sounds/features/ai-generate'

/**
 * Whether an ElevenLabs key is stored. The key lives in localStorage (not in a
 * store), so this subscribes to the Settings modal: closing Settings — the only
 * place the key changes — re-renders consumers and the key is read again.
 */
export function useElevenLabsConnection() {
  const settingsOpen = useEditorUIStore((state) => state.settingsOpen)
  const openSettings = useEditorUIStore((state) => state.openSettings)

  const isConnected = !settingsOpen && Boolean(getElevenLabsApiKey())

  return { isConnected, openSettings }
}
