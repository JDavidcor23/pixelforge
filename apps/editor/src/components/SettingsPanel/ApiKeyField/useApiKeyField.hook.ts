import { useCallback, useId } from 'react'
import type { ChangeEvent, KeyboardEvent } from 'react'

interface UseApiKeyFieldResult {
  inputId: string
  handleChange: (event: ChangeEvent<HTMLInputElement>) => void
  handleKeyDown: (event: KeyboardEvent<HTMLInputElement>) => void
}

export const useApiKeyField = (
  onChange: (value: string) => void,
  onSave: () => void
): UseApiKeyFieldResult => {
  const inputId = useId()

  const handleChange = useCallback(
    (event: ChangeEvent<HTMLInputElement>) => onChange(event.target.value),
    [onChange]
  )

  const handleKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      // Escape bubbles to the dialog so it can close; everything else stays
      // in the field so editor-wide shortcuts don't fire while typing.
      if (event.key === 'Escape') return
      event.stopPropagation()
      if (event.key === 'Enter') onSave()
    },
    [onSave]
  )

  return { inputId, handleChange, handleKeyDown }
}
