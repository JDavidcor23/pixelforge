import { Key, Eye, EyeOff, X, Trash2, Check, ExternalLink, Shield } from 'lucide-react'
import { useSettingsPanel } from './useSettingsPanel.hook'

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
    handleSaveRetroKey,
    handleRemoveRetroKey,
    elevenLabsKey,
    setElevenLabsKey,
    showElevenLabsKey,
    toggleShowElevenLabsKey,
    hasElevenLabsKey,
    handleSaveElevenLabsKey,
    handleRemoveElevenLabsKey,
    savedFeedback,
    handleClose,
  } = useSettingsPanel(onClose)

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm"
      onClick={handleClose}
      role="dialog"
      aria-modal="true"
      aria-label="Settings"
    >
      <div
        className="relative w-full max-w-md rounded-2xl border border-zinc-700/50 bg-[#12141a] p-6 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="mb-6 flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-100">Settings</h2>
          <button
            onClick={handleClose}
            aria-label="Close settings"
            className="rounded-lg p-1.5 text-zinc-500 transition-colors hover:bg-zinc-800 hover:text-zinc-300"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* API Keys Section */}
        <div className="flex flex-col gap-5">
          <div className="flex items-center gap-2 border-b border-zinc-800 pb-2">
            <Key className="h-4 w-4 text-violet-400" />
            <span className="text-sm font-medium text-gray-300">API Keys</span>
          </div>

          {/* Retro Diffusion Key */}
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
            helpUrl="https://www.retrodiffusion.ai/app/guide/api"
            saved={savedFeedback === 'retro'}
          />

          {/* ElevenLabs Key */}
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
            helpUrl="https://elevenlabs.io/docs/api-reference/authentication"
            saved={savedFeedback === 'elevenlabs'}
          />

          {/* Privacy notice */}
          <div className="flex items-start gap-2 rounded-lg bg-zinc-800/50 px-3 py-2.5">
            <Shield className="mt-0.5 h-4 w-4 shrink-0 text-emerald-400" />
            <p className="text-xs leading-relaxed text-zinc-400">
              Keys are stored locally in your browser. They are never sent to our servers.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

// ── Internal Component ─────────────────────────────────────────────────────────

interface ApiKeyFieldProps {
  label: string
  value: string
  onChange: (v: string) => void
  showKey: boolean
  onToggleShow: () => void
  hasStoredKey: boolean
  onSave: () => void
  onRemove: () => void
  placeholder: string
  helpUrl: string
  saved: boolean
}

function ApiKeyField({
  label,
  value,
  onChange,
  showKey,
  onToggleShow,
  hasStoredKey,
  onSave,
  onRemove,
  placeholder,
  helpUrl,
  saved,
}: ApiKeyFieldProps) {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label className="text-xs font-medium text-gray-400">{label}</label>
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1 text-[10px] text-zinc-500 transition-colors hover:text-violet-400"
        >
          Get a key <ExternalLink className="h-3 w-3" />
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            onKeyDown={(e) => {
              e.stopPropagation()
              if (e.key === 'Enter') onSave()
            }}
            placeholder={placeholder}
            aria-label={`${label} API key`}
            className="w-full rounded-lg border border-zinc-700 bg-zinc-900 px-3 py-2 pr-9 text-sm text-gray-100 placeholder-zinc-600 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
          <button
            type="button"
            onClick={onToggleShow}
            aria-label={showKey ? 'Hide key' : 'Show key'}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-zinc-500 transition-colors hover:text-zinc-300"
          >
            {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {hasStoredKey ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label} key`}
            className="rounded-lg bg-red-900/40 px-3 py-2 text-red-300 transition-colors hover:bg-red-900/60"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={!value.trim()}
          aria-label={`Save ${label} key`}
          className="flex items-center justify-center rounded-lg bg-violet-600 px-3 py-2 text-sm font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saved ? <Check className="h-4 w-4" /> : 'Save'}
        </button>
      </div>
    </div>
  )
}
