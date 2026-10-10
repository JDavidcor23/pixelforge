import { useCallback } from 'react'

import { useSoundsStore } from '@/stores/sounds.store'
import { FILTER_LIMITS, FILTER_TYPES, HZ_PER_KHZ, SYNTH_CONTROL_STEP } from '@/constants/audio'
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
    if (freq >= HZ_PER_KHZ) {
      return `${(freq / HZ_PER_KHZ).toFixed(1)}kHz`
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
    frequencyStep: SYNTH_CONTROL_STEP.FREQUENCY_HZ,
    qStep: SYNTH_CONTROL_STEP.Q,
    handleTypeChange,
    handleFrequencyChange,
    handleQChange,
    formatFrequency,
    formatQ,
  }
}
