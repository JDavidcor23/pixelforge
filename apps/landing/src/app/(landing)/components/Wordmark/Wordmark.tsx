import { BRAND } from '@/constants/BRAND'
import type { WordmarkProps } from '../../types'

export const Wordmark = ({ className }: WordmarkProps) => {
  return (
    <span className={className}>
      {BRAND.NAME}{' '}
      <span className="text-accent">{BRAND.SUFFIX}</span>
    </span>
  )
}
