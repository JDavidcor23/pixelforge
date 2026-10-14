import { useUnfinishedJobs } from './useUnfinishedJobs.hook'
import { SECONDARY_BUTTON, SECTION_LABEL } from './animate-tab.classes'
import {
  ANIMATION_RECOVER_DISCARDED_TAG,
  ANIMATION_RECOVER_LABEL,
  ANIMATION_RECOVERING_LABEL,
  ANIMATION_REMOVE_JOB_LABEL,
  ANIMATION_UNFINISHED_HINT,
  ANIMATION_UNFINISHED_TITLE,
} from '@/constants/animation'

export const UnfinishedJobs = () => {
  const { items, notice, isVisible, handleRecover, handleRemove } = useUnfinishedJobs()

  if (!isVisible) return null

  return (
    <div className="flex flex-col gap-2 rounded-sm border border-ai/40 bg-ai/10 p-2">
      <span className={SECTION_LABEL}>{ANIMATION_UNFINISHED_TITLE}</span>
      {items.length > 0 && <p className="text-2xs text-subtle">{ANIMATION_UNFINISHED_HINT}</p>}

      {notice && (
        <p className={`text-xs ${notice.tone === 'failed' ? 'text-danger' : 'text-ai-ink'}`}>{notice.message}</p>
      )}

      {items.map((item) => (
        <div key={item.jobId} className="flex items-center justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-xs text-ai-ink">{item.label}</span>
            <span className="text-2xs text-subtle">
              {item.submittedLabel}
              {item.isDiscarded && ` · ${ANIMATION_RECOVER_DISCARDED_TAG}`}
            </span>
            {item.stateMessage && <span className="text-2xs text-muted">{item.stateMessage}</span>}
          </div>
          <div className="flex shrink-0 items-center gap-1">
            {item.canRemove && (
              <button
                type="button"
                onClick={() => handleRemove(item.jobId)}
                disabled={item.isRecovering}
                className={SECONDARY_BUTTON}
              >
                {ANIMATION_REMOVE_JOB_LABEL}
              </button>
            )}
            <button
              type="button"
              onClick={() => handleRecover(item.jobId)}
              disabled={item.isRecovering}
              className={SECONDARY_BUTTON}
            >
              {item.isRecovering ? ANIMATION_RECOVERING_LABEL : ANIMATION_RECOVER_LABEL}
            </button>
          </div>
        </div>
      ))}
    </div>
  )
}
