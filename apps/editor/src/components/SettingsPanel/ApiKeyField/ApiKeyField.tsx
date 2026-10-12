import { Check, ExternalLink, Eye, EyeOff, Trash2 } from 'lucide-react'

import { useApiKeyField } from './useApiKeyField.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface ApiKeyFieldProps {
  label: string
  value: string
  onChange: (value: string) => void
  showKey: boolean
  onToggleShow: () => void
  hasStoredKey: boolean
  onSave: () => void
  onRemove: () => void
  placeholder: string
  helpUrl: string
  saved: boolean
}

export function ApiKeyField({
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
  const { inputId, handleChange, handleKeyDown } = useApiKeyField(onChange, onSave)

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center justify-between">
        <label htmlFor={inputId} className="text-xs font-medium text-muted">{label}</label>
        <a
          href={helpUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={`flex items-center gap-1 rounded-sm text-2xs text-subtle hover:text-accent ${MOTION.COLORS} ${FOCUS_RING.RAISED}`}
        >
          Get a key <ExternalLink className="size-3" aria-hidden />
        </a>
      </div>
      <div className="flex gap-2">
        <div className="relative flex-1">
          <input
            id={inputId}
            type={showKey ? 'text' : 'password'}
            value={value}
            onChange={handleChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            aria-label={`${label} API key`}
            className={`h-8.5 w-full rounded-sm border border-line bg-sunken px-2.5 pr-9 text-ui text-ink placeholder:text-subtle ${MOTION.COLORS} ${FOCUS_RING.INPUT}`}
          />
          <button
            type="button"
            onClick={onToggleShow}
            aria-label={showKey ? 'Hide key' : 'Show key'}
            className={`absolute right-1.5 top-1/2 -translate-y-1/2 rounded-sm p-1 text-subtle hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.BASE}`}
          >
            {showKey ? <EyeOff className="size-3.5" aria-hidden /> : <Eye className="size-3.5" aria-hidden />}
          </button>
        </div>
        {hasStoredKey ? (
          <button
            type="button"
            onClick={onRemove}
            aria-label={`Remove ${label} key`}
            className={`flex size-8.5 shrink-0 items-center justify-center rounded-sm border border-line-strong text-muted hover:border-danger/40 hover:text-danger ${MOTION.PRESS} ${FOCUS_RING.RAISED}`}
          >
            <Trash2 className="size-3.5" aria-hidden />
          </button>
        ) : null}
        <button
          type="button"
          onClick={onSave}
          disabled={!value.trim()}
          aria-label={`Save ${label} key`}
          className={`flex h-8.5 min-w-15 shrink-0 items-center justify-center rounded-sm bg-accent px-3 text-ui font-semibold text-on-accent enabled:hover:bg-accent-strong disabled:cursor-not-allowed disabled:bg-hover disabled:text-subtle ${MOTION.PRESS} ${FOCUS_RING.RAISED}`}
        >
          {saved ? <Check className="size-3.5" aria-hidden /> : 'Save'}
        </button>
      </div>
    </div>
  )
}
