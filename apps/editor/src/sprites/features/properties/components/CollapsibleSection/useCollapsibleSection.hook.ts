import { useCallback, useState } from 'react'

export const useCollapsibleSection = (defaultOpen: boolean) => {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  const toggle = useCallback(() => setIsOpen((open) => !open), [])

  return { isOpen, toggle }
}
