'use client'

import { Key, Eye, EyeOff, Loader2, Sparkles, X, AlertCircle, Upload, Trash2 } from 'lucide-react'
import { ModelSelector } from '../ModelSelector/ModelSelector'
import { useAIGeneratePanel } from './useAIGeneratePanel.hook'

export function AIGeneratePanel() {
  const {
    mode,
    prompt,
    voiceId,
    apiKey,
    hasStoredKey,
    showKey,
    referenceFile,
    referenceError,
    isLoading,
    error,
    canGenerate,
    promptPlaceholder,
    setPrompt,
    setVoiceId,
    setApiKey,
    handleSaveKey,
    handleRemoveKey,
    handleToggleShowKey,
    handleModeChange,
    handleReferenceFileChange,
    handleGenerate,
    handleCancel,
  } = useAIGeneratePanel()

  return (
    <div className="flex flex-col gap-4 rounded-xl bg-gray-900 p-4">
      {/* API Key Section */}
      <section className="flex flex-col gap-2 rounded-lg bg-gray-800 p-3">
        <div className="flex items-center gap-2">
          <Key className="h-4 w-4 text-violet-400" />
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            ElevenLabs API Key
          </span>
        </div>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <input
              type={showKey ? 'text' : 'password'}
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Enter your ElevenLabs API key"
              aria-label="ElevenLabs API key"
              className="w-full rounded-md border border-gray-700 bg-gray-900 px-3 py-2 pr-9 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
            />
            <button
              type="button"
              onClick={handleToggleShowKey}
              aria-label={showKey ? 'Hide API key' : 'Show API key'}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
            >
              {showKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          {hasStoredKey ? (
            <button
              type="button"
              onClick={handleRemoveKey}
              aria-label="Remove stored API key"
              className="rounded-md bg-red-900/50 px-3 py-2 text-xs font-medium text-red-300 transition-colors hover:bg-red-900/70"
            >
              <Trash2 className="h-4 w-4" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleSaveKey}
              disabled={!apiKey.trim()}
              aria-label="Save API key"
              className="rounded-md bg-violet-600 px-3 py-2 text-xs font-medium text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Save
            </button>
          )}
        </div>
      </section>

      {/* Mode Selector */}
      <ModelSelector selectedMode={mode} onModeChange={handleModeChange} />

      {/* Prompt Input */}
      <section className="flex flex-col gap-2">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          placeholder={promptPlaceholder}
          rows={3}
          aria-label="Generation prompt"
          className="w-full resize-none rounded-lg border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
        />
      </section>

      {/* Music Mode: Reference File */}
      {mode === 'music' && (
        <section className="flex flex-col gap-2 rounded-lg bg-gray-800 p-3">
          <span className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Reference Track (optional)
          </span>
          <label
            htmlFor="reference-file-input"
            className="flex cursor-pointer items-center gap-2 rounded-md border border-dashed border-gray-600 px-3 py-2 text-sm text-gray-400 transition-colors hover:border-violet-500 hover:text-violet-400"
          >
            <Upload className="h-4 w-4" />
            <span>{referenceFile ? referenceFile.name : 'Upload audio file (max 10MB)'}</span>
            <input
              id="reference-file-input"
              type="file"
              accept=".wav,.mp3,.ogg"
              onChange={(e) => handleReferenceFileChange(e.target.files?.[0] ?? null)}
              className="hidden"
              aria-label="Upload reference track"
            />
          </label>
          {referenceError && (
            <p className="text-xs text-red-400" role="alert">{referenceError}</p>
          )}
        </section>
      )}

      {/* TTS Mode: Voice ID */}
      {mode === 'tts' && (
        <section className="flex flex-col gap-2">
          <label htmlFor="voice-id-input" className="text-xs font-semibold uppercase tracking-wide text-gray-400">
            Voice ID
          </label>
          <input
            id="voice-id-input"
            type="text"
            value={voiceId}
            onChange={(e) => setVoiceId(e.target.value)}
            placeholder="Enter ElevenLabs Voice ID"
            aria-label="ElevenLabs Voice ID"
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-3 py-2 text-sm text-gray-100 placeholder-gray-500 focus:border-violet-500 focus:outline-none focus:ring-1 focus:ring-violet-500"
          />
        </section>
      )}

      {/* Error Display */}
      {error && (
        <div
          className="flex items-start gap-2 rounded-lg bg-red-900/30 px-3 py-2 text-sm text-red-300"
          role="alert"
          aria-live="polite"
        >
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Generate / Cancel Buttons */}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleGenerate}
          disabled={!canGenerate || isLoading}
          aria-label="Generate audio"
          className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-violet-600 px-4 py-3 text-sm font-semibold text-white transition-colors hover:bg-violet-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isLoading ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              <span>Generating...</span>
            </>
          ) : (
            <>
              <Sparkles className="h-4 w-4" />
              <span>Generate</span>
            </>
          )}
        </button>
        {isLoading && (
          <button
            type="button"
            onClick={handleCancel}
            aria-label="Cancel generation"
            className="flex items-center justify-center rounded-lg bg-gray-700 px-4 py-3 text-sm font-medium text-gray-300 transition-colors hover:bg-gray-600"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
