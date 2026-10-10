import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { FILTER_TYPES, FILTER_LIMITS } from '@/constants/audio'
import type { FilterType } from '@/types/audio'

export function useFilterControls() {
  const filter = useSoundsStore((state) => state.synthParams.filter)
  const setFilterParam = useSoundsStore((state) => state.setFilterParam)

  const handleTypeChange = useCallback(
    (type: FilterType) => {
      setFilterParam('type', type)
    },
    [setFilterParam]
  )

  const handleFrequencyChange = useCallback(
    (frequency: number) => {
      setFilterParam('frequency', frequency)
    },
    [setFilterParam]
  )

  const handleQChange = useCallback(
    (q: number) => {
      setFilterParam('q', q)
    },
    [setFilterParam]
  )

  const formatFrequency = useCallback((freq: number): string => {
    if (freq >= 1000) {
      return `${(freq / 1000).toFixed(1)}kHz`
    }
    return `${Math.round(freq)}Hz`
  }, [])

  const formatQ = useCallback((q: number): string => {
    return q.toFixed(1)
  }, [])

  return {
    filter,
    filterTypes: FILTER_TYPES,
    frequencyLimits: FILTER_LIMITS.frequency,
    qLimits: FILTER_LIMITS.q,
    handleTypeChange,
    handleFrequencyChange,
    handleQChange,
    formatFrequency,
    formatQ,
  }
}
