import { Plus } from 'lucide-react'
import { useColorInputs } from './useColorInputs.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

interface ColorInputsProps {
  readonly color: string // Hex format: "#ff0000"
  readonly onChange: (newHex: string) => void
}

const FIELD =
  'rounded border border-line bg-base px-1.5 py-1 text-center font-mono text-xs text-ink outline-none focus:border-accent'

/**
 * Fine-grained color control via HEX and RGBA values.
 */
export const ColorInputs: React.FC<ColorInputsProps> = ({ color, onChange }) => {
  const { hexInput, currentRgba, handleHexChange, handleRgbaChange, handleSave, handleHexFocus, handleHexBlur } =
    useColorInputs({
      color,
      onChange,
    })

  return (
    <div className="flex flex-col gap-3 rounded-sm border border-line-strong bg-raised p-3 font-mono text-xs">
      {/* HEX Section */}
      <div className="flex flex-col gap-1.5">
        <label className="font-mono text-2xs uppercase tracking-wider text-subtle" htmlFor="hex-input">
          Hex
        </label>
        <div className="flex items-center gap-2">
          <div className="relative flex-1">
            <span className="pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-2xs text-subtle">
              #
            </span>
            <input
              id="hex-input"
              type="text"
              value={hexInput.replace(/^#/, '')}
              onChange={(e) => handleHexChange(`#${e.target.value}`)}
              onFocus={handleHexFocus}
              onBlur={handleHexBlur}
              onKeyDown={(e) => e.stopPropagation()}
              onPaste={(e) => e.stopPropagation()}
              className={`w-full pl-4 pr-2 text-left ${FIELD}`}
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            title="Save to palette"
            className={`flex h-7 shrink-0 items-center gap-1 rounded px-2 text-2xs font-medium text-accent hover:bg-hover ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
          >
            <Plus size={14} aria-hidden />
            Save
          </button>
        </div>
      </div>

      {/* RGBA Section */}
      <div className="grid grid-cols-4 gap-2">
        {(['r', 'g', 'b', 'a'] as const).map((channel) => (
          <div key={channel} className="flex flex-col gap-1">
            <label className="text-2xs uppercase text-subtle" htmlFor={`rgb-${channel}-input`}>
              {channel}
            </label>
            <input
              id={`rgb-${channel}-input`}
              type="number"
              value={currentRgba[channel]}
              min={0}
              max={255}
              onChange={(e) => handleRgbaChange(channel, e.target.value)}
              onKeyDown={(e) => e.stopPropagation()}
              onPaste={(e) => e.stopPropagation()}
              className={`${FIELD} [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
