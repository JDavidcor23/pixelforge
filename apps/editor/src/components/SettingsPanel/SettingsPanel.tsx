import { Key, Shield, Trash2, UserRound, X } from 'lucide-react'

import { ApiKeyField } from './ApiKeyField/ApiKeyField'
import { useSettingsPanel } from './useSettingsPanel.hook'
import { ModalPortal } from '@/components/ModalPortal/ModalPortal'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'
import { API_KEY_HELP_URL } from '@/constants/settings'
import { Z_INDEX } from '@/constants/z-index'

interface SettingsPanelProps {
  onClose: () => void
}

export function SettingsPanel({ onClose }: SettingsPanelProps) {
  const {
    retroKey,
    setRetroKey,
    showRetroKey,
    toggleShowRetroKey,
    hasRetroKey,
    isRetroSaved,
    handleSaveRetroKey,
    handleRemoveRetroKey,
    elevenLabsKey,
    setElevenLabsKey,
    showElevenLabsKey,
    toggleShowElevenLabsKey,
    hasElevenLabsKey,
    isElevenLabsSaved,
    handleSaveElevenLabsKey,
    handleRemoveElevenLabsKey,
    handleClose,
    dialogRef,
    titleId,
    handleKeyDown,
    handlePanelClick,
    isSignedIn,
    handleDeleteAccountClick,
  } = useSettingsPanel(onClose)

  return (
    <ModalPortal>
      <div
        className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center bg-base/70 backdrop-blur-sm ${MOTION.FADE_ENTER}`}
        onClick={handleClose}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          tabIndex={-1}
          onClick={handlePanelClick}
          onKeyDown={handleKeyDown}
          className={`relative flex w-full max-w-md flex-col overflow-hidden rounded-md border border-line-strong bg-raised shadow-popover outline-none ${MOTION.ENTER}`}
        >
          <div className="flex items-center justify-between border-b border-line px-4 py-3.5">
            <h2 id={titleId} className="text-sm font-semibold text-ink">
              Settings
            </h2>
            <button
              type="button"
              onClick={handleClose}
              aria-label="Close settings"
              className={`rounded-sm p-1 text-subtle hover:bg-hover hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
            >
              <X className="size-3.5" aria-hidden />
            </button>
          </div>

          <div className="flex flex-col gap-5 p-4">
            <div className="flex items-center gap-2">
              <Key className="size-3.5 text-subtle" aria-hidden />
              <span className="text-ui font-semibold text-ink">API Keys</span>
            </div>

            <ApiKeyField
              label="Retro Diffusion"
              value={retroKey}
              onChange={setRetroKey}
              showKey={showRetroKey}
              onToggleShow={toggleShowRetroKey}
              hasStoredKey={hasRetroKey}
              onSave={handleSaveRetroKey}
              onRemove={handleRemoveRetroKey}
              placeholder="Paste your Retro Diffusion API key"
              helpUrl={API_KEY_HELP_URL.RETRO_DIFFUSION}
              saved={isRetroSaved}
            />

            <ApiKeyField
              label="ElevenLabs"
              value={elevenLabsKey}
              onChange={setElevenLabsKey}
              showKey={showElevenLabsKey}
              onToggleShow={toggleShowElevenLabsKey}
              hasStoredKey={hasElevenLabsKey}
              onSave={handleSaveElevenLabsKey}
              onRemove={handleRemoveElevenLabsKey}
              placeholder="Paste your ElevenLabs API key"
              helpUrl={API_KEY_HELP_URL.ELEVENLABS}
              saved={isElevenLabsSaved}
            />

            <div className="flex items-start gap-2 rounded-sm border border-line bg-surface px-3 py-2.5">
              <Shield className="mt-0.5 size-3.5 shrink-0 text-success" aria-hidden />
              <p className="text-xs leading-relaxed text-muted">
                Keys are stored locally in your browser. They are never sent to our servers.
              </p>
            </div>

            {isSignedIn && (
              <div className="flex flex-col gap-2 border-t border-line pt-4">
                <div className="flex items-center gap-2">
                  <UserRound className="size-3.5 text-subtle" aria-hidden />
                  <span className="text-ui font-semibold text-ink">Account</span>
                </div>
                <button
                  type="button"
                  onClick={handleDeleteAccountClick}
                  className={`flex items-center gap-2 self-start rounded-sm px-2 py-1.5 text-xs font-medium text-danger hover:bg-hover ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
                >
                  <Trash2 className="size-3.5" aria-hidden />
                  Delete my account
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
