'use client'

import { Sparkles, Palette, Download } from 'lucide-react'

import { OpacitySlider } from '../OpacitySlider/OpacitySlider'
import { ColorInputs } from '../ColorInputs/ColorInputs'
import { ColorArea } from '../ColorArea/ColorArea'
import { ColorPalette } from '../ColorPalette/ColorPalette'
import { CollapsibleSection } from './CollapsibleSection'
import { useRightSidebar, useColorSection, useAiCopilot } from './useRightSidebar.hook'
import { useExport } from './useExport.hook'
import { useCursorPixel } from '@/app/editor/sprites/hooks/useSpriteEditorStore.hook'

const CursorPositionInputs = () => {
  const cursorPixel = useCursorPixel()
  return (
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
  )
}

const ColorSectionInputs = () => {
  const {
    primaryHex,
    secondaryHex,
    activeColorHex,
    activeColorType,
    handleColorChange,
    handleToggleActiveColor,
  } = useColorSection()

  return (
    <>
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
      <div className="mt-4">
        <div className="mb-2 text-[10px] uppercase tracking-wider text-[#8888aa]">Saved Palette</div>
        <ColorPalette />
      </div>
    </>
  )
}

const AiCopilotSection = () => {
  const { pfmText, setPfmText, error, handleApply } = useAiCopilot()
  return (
    <div className="flex flex-col gap-2">
      <textarea
        value={pfmText}
        onChange={(e) => setPfmText(e.target.value)}
        rows={10}
        placeholder={
          'SIZE: 16x16\nPALETTE:\n  . : transparent\n  X : #FF0000\nGRID:\n  . X . X .\n  ...'
        }
        onKeyDown={(e) => e.stopPropagation()}
        onPaste={(e) => e.stopPropagation()}
        className="w-full resize-y rounded border border-white/10 bg-[#1a1a2e] p-2 font-mono text-[11px] text-[#ededed] placeholder:text-[#444466] focus:border-[#00f5ff]/40 focus:outline-none focus:ring-1 focus:ring-[#00f5ff]/40"
      />
      {error && <p className="text-[10px] text-red-400">{error}</p>}
      <button
        type="button"
        onClick={handleApply}
        disabled={!pfmText.trim()}
        className="w-full rounded border border-[#00f5ff]/20 bg-[#00f5ff]/10 py-2 text-xs font-medium text-[#00f5ff] transition-colors hover:bg-[#00f5ff]/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        Apply PFM
      </button>
    </div>
  )
}

export const RightSidebar = () => {
  const {
    activeLayerOpacity,
    handleOpacityChange,
  } = useRightSidebar()

  const { handleExportFrame, handleExportSpriteSheet } = useExport()

  return (
    <div className="flex h-full flex-col gap-6 overflow-y-auto border-l border-white/10 bg-[#0f1115] p-4 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent hover:scrollbar-thumb-white/20">
      <CollapsibleSection title="Position">
        <CursorPositionInputs />
      </CollapsibleSection>

      <CollapsibleSection title="Opacity">
        <OpacitySlider value={activeLayerOpacity} onChange={handleOpacityChange} />
      </CollapsibleSection>

      <CollapsibleSection title="Color" icon={<Palette size={14} />}>
        <ColorSectionInputs />
      </CollapsibleSection>

      <CollapsibleSection title="Export" icon={<Download size={14} />}>
        <div className="flex flex-col gap-2">
          <button
            onClick={handleExportFrame}
            className="flex w-full items-center justify-center gap-2 rounded border border-white/10 bg-[#1a1a2e] py-2 text-xs font-medium text-[#ededed] transition-colors hover:bg-[#252540]"
          >
            <Download size={12} />
            Export Current Frame
          </button>
          <button
            onClick={handleExportSpriteSheet}
            className="flex w-full items-center justify-center gap-2 rounded border border-[#00f5ff]/20 bg-[#00f5ff]/10 py-2 text-xs font-medium text-[#00f5ff] transition-colors hover:bg-[#00f5ff]/20"
          >
            <Download size={12} />
            Export Sprite Sheet
          </button>
        </div>
      </CollapsibleSection>


      <CollapsibleSection title="AI Copilot" defaultOpen={false} icon={<Sparkles size={16} className="text-[#00f5ff]" />}>
        <AiCopilotSection />
      </CollapsibleSection>
    </div>
  )
}
