import { useCallback } from 'react'

import { PERCENT_SCALE } from '@/constants/audio'

interface UseTweakSliderParams {
  value: number
  min: number
  max: number
  onChange: (value: number) => void
}

export function useTweakSlider({ value, min, max, onChange }: UseTweakSliderParams) {
  const span = max - min
  const ratio = span > 0 ? (Math.min(max, Math.max(min, value)) - min) / span : 0
  const percent = `${ratio * PERCENT_SCALE}%`

  const handleChange = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => onChange(Number(event.target.value)),
    [onChange]
  )

  return { percent, handleChange }
}
