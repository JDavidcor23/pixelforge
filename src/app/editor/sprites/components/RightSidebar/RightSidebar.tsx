'use client'

import { Sparkles } from 'lucide-react'

import { OpacitySlider } from '../OpacitySlider/OpacitySlider'
import { useRightSidebar } from './useRightSidebar.hook'

export const RightSidebar = () => {
  const { cursorPixel, activeLayerOpacity, handleOpacityChange } = useRightSidebar()

  return (
    <div className="flex h-full flex-col gap-6 border-l border-white/10 bg-[#0f1115] p-4">
      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8888aa]">
          Position
        </h3>
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] text-[#8888aa]">X</label>
            <input
              type="text"
              readOnly
              value={cursorPixel?.x ?? '\u2014'}
              className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-1 text-xs text-[#ededed]"
            />
          </div>
          <div className="flex-1">
            <label className="mb-1 block text-[10px] text-[#8888aa]">Y</label>
            <input
              type="text"
              readOnly
              value={cursorPixel?.y ?? '\u2014'}
              className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-1 text-xs text-[#ededed]"
            />
          </div>
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8888aa]">
          Opacity
        </h3>
        <OpacitySlider value={activeLayerOpacity} onChange={handleOpacityChange} />
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8888aa]">
          Shader
        </h3>
        <select
          disabled
          className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-1 text-xs text-[#8888aa]"
        >
          <option>None</option>
          <option>Glow</option>
          <option>Outline</option>
        </select>
      </section>

      <section>
        <h3 className="mb-2 text-xs font-medium uppercase tracking-wider text-[#8888aa]">
          AI Copilot
        </h3>
        <div className="flex items-center gap-2 rounded border border-white/10 bg-[#1a1a2e] p-3">
          <Sparkles size={16} className="text-[#00f5ff]" />
          <span className="text-xs text-[#8888aa]">Coming soon</span>
        </div>
      </section>
    </div>
  )
}

