import { usePositionFields } from './usePositionFields.hook'

const FIELD =
  'h-8 w-full rounded border border-line bg-base pl-6 pr-2 font-mono text-xs text-ink outline-none focus:border-accent'
const PREFIX =
  'pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-2xs text-subtle'

export const PositionFields = () => {
  const { x, y } = usePositionFields()

  return (
    <div className="flex gap-2">
      <div className="relative flex-1">
        <span className={PREFIX}>X</span>
        <input type="text" readOnly value={x} className={FIELD} />
      </div>
      <div className="relative flex-1">
        <span className={PREFIX}>Y</span>
        <input type="text" readOnly value={y} className={FIELD} />
      </div>
    </div>
  )
}
