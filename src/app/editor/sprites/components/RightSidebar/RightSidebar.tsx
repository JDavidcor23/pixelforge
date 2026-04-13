'use client'

import { Sparkles, Palette } from 'lucide-react'

import { OpacitySlider } from '../OpacitySlider/OpacitySlider'
import { ColorInputs } from '../ColorInputs/ColorInputs'
import { ColorArea } from '../ColorArea/ColorArea'
import { CollapsibleSection } from './CollapsibleSection'
import { useRightSidebar } from './useRightSidebar.hook'

export const RightSidebar = () => {
  const {
    cursorPixel,
    activeLayerOpacity,
    primaryHex,
    secondaryHex,
    activeColorHex,
    activeColorType,
    handleOpacityChange,
    handleColorChange,
    handleToggleActiveColor,
  } = useRightSidebar()

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto border-l border-white/10 bg-[#0f1115] p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
      <CollapsibleSection title="Position">
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
      </CollapsibleSection>

      <CollapsibleSection title="Opacity">
        <OpacitySlider value={activeLayerOpacity} onChange={handleOpacityChange} />
      </CollapsibleSection>

      <CollapsibleSection title="Color" icon={<Palette size={14} />}>
        <div className="mb-4 flex items-center gap-4">
          <button
            type="button"
            onClick={() => handleToggleActiveColor('primary')}
            className={`relative h-10 w-10 rounded-lg border-2 transition-all ${
              activeColorType === 'primary'
                ? 'border-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.3)]'
                : 'border-white/10'
            }`}
            style={{ backgroundColor: primaryHex }}
            title="Primary Color"
          />
          <button
            type="button"
            onClick={() => handleToggleActiveColor('secondary')}
            className={`relative h-10 w-10 rounded-lg border-2 transition-all ${
              activeColorType === 'secondary'
                ? 'border-[#00f5ff] shadow-[0_0_10px_rgba(0,245,255,0.3)]'
                : 'border-white/10'
            }`}
            style={{ backgroundColor: secondaryHex }}
            title="Secondary Color"
          />
          <div className="text-[10px] text-[#8888aa]">
            Editing: <span className="uppercase text-white">{activeColorType}</span>
          </div>
        </div>

        <ColorArea onChange={handleColorChange} />
        <ColorInputs color={activeColorHex} onChange={handleColorChange} />
      </CollapsibleSection>


      <CollapsibleSection title="AI Copilot" defaultOpen={false} icon={<Sparkles size={16} className="text-[#00f5ff]" />}>
        <div className="flex items-center gap-2 rounded border border-white/10 bg-[#1a1a2e] p-3">
          <span className="text-xs text-[#8888aa]">Coming soon</span>
        </div>
      </CollapsibleSection>
    </div>
  )
}

