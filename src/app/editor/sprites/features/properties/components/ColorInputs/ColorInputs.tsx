'use client'

import { Plus } from 'lucide-react'
import { useColorInputs } from './useColorInputs.hook'

interface ColorInputsProps {
  readonly color: string // Hex format: "#ff0000"
  readonly onChange: (newHex: string) => void
}

/**
 * ColorInputs component allows fine-grained color control via HEX and RGB values.
 * Follows a dark-mode "Inspector" aesthetic with neon accents.
 */
export const ColorInputs: React.FC<ColorInputsProps> = ({ color, onChange }) => {
  const { hexInput, currentRgba, handleHexChange, handleRgbaChange, handleSave } =
    useColorInputs({
      color,
      onChange,
    })

  return (
    <div className="w-full rounded-lg border border-white/10 bg-[#1e222a] p-4 font-mono text-xs text-slate-300 shadow-xl">
      {/* HEX Section */}
      <div className="mb-4 flex items-center justify-between">
        <label className="tracking-tighter uppercase text-cyan-400" htmlFor="hex-input">
          Hex
        </label>
        <div className="flex items-center gap-2">
          <div className="relative">
            <input
              id="hex-input"
              type="text"
              value={hexInput}
              onChange={(e) => handleHexChange(e.target.value)}
              className="w-24 rounded border border-white/5 bg-[#0f1115] px-2 py-1 text-right outline-none transition-colors focus:border-cyan-500"
              spellCheck={false}
            />
          </div>
          <button
            type="button"
            onClick={handleSave}
            className="flex h-7 w-7 items-center justify-center rounded bg-cyan-700/30 text-cyan-400 transition-colors hover:bg-cyan-700/50 hover:text-cyan-300 active:bg-cyan-600/50"
            title="Save to palette"
          >
            <Plus size={14} />
          </button>
        </div>
      </div>

      {/* RGBA Section */}
      <div className="grid grid-cols-4 gap-2">
        {(['r', 'g', 'b', 'a'] as const).map((channel) => (
          <div key={channel} className="flex flex-col gap-1">
            <label 
              className={`text-[10px] uppercase ${channel === 'a' ? 'text-orange-400' : 'text-pink-500'}`}
              htmlFor={`rgb-${channel}-input`}
            >
              {channel}
            </label>
            <input
              id={`rgb-${channel}-input`}
              type="number"
              value={currentRgba[channel]}
              min={0}
              max={255}
              onChange={(e) => handleRgbaChange(channel, e.target.value)}
              className={`rounded border border-white/5 bg-[#0f1115] px-1 py-1 text-center outline-none transition-colors ${
                channel === 'a' ? 'focus:border-orange-400' : 'focus:border-pink-500'
              } [appearance:textfield] [&::-webkit-inner-spin-button]:appearance-none [&::-webkit-outer-spin-button]:appearance-none`}
            />
          </div>
        ))}
      </div>
    </div>
  )
}
