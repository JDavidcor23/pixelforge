'use client'

import { Sparkles, Palette, Download, Code, FileJson } from 'lucide-react'

import { OpacitySlider } from '../OpacitySlider/OpacitySlider'
import { ColorInputs } from '../ColorInputs/ColorInputs'
import { ColorArea } from '../ColorArea/ColorArea'
import { ColorPalette } from '../ColorPalette/ColorPalette'
import { CollapsibleSection } from './CollapsibleSection'
import { useRightSidebar, useColorSection, usePixelLabCopilot, useDemoSprite, type AIGeneration } from './useRightSidebar.hook'
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


const PixelLabHistory = ({ 
  generations, 
  onSelect,
  onDownload,
  onDownloadSource,
  activeId 
}: { 
  generations: AIGeneration[], 
  onSelect: (gen: AIGeneration) => void,
  onDownload: (gen: AIGeneration) => void,
  onDownloadSource: (gen: AIGeneration) => void,
  activeId?: string 
}) => {
  if (generations.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-[#8888aa]">Recent Generations</div>
      <div className="grid grid-cols-2 gap-2">
        {generations.map((gen) => (
          <div
            key={gen.id}
            className={`group relative flex flex-col gap-1 overflow-hidden rounded border bg-[#1a1a2e] p-1.5 transition-all hover:border-purple-500/40 ${
              activeId === gen.id ? 'border-purple-500 shadow-[0_0_8px_rgba(168,85,247,0.2)]' : 'border-white/5'
            }`}
          >
            <div className="aspect-square relative w-full overflow-hidden rounded bg-black/20">
              <img 
                src={gen.base64} 
                alt={gen.prompt}
                className="h-full w-full object-contain image-pixelated cursor-pointer"
                onClick={() => onSelect(gen)}
              />
              
              {/* Actions Overlay */}
              <div className="absolute right-1 top-1 flex flex-col gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                <button
                  onClick={(e) => { e.stopPropagation(); onDownload(gen); }}
                  className="rounded bg-black/60 p-1 text-white hover:bg-purple-600"
                  title="Download PNG"
                >
                  <Download size={12} />
                </button>
                <button
                  onClick={(e) => { e.stopPropagation(); onDownloadSource(gen); }}
                  className="rounded bg-black/60 p-1 text-white hover:bg-purple-600"
                  title="Download Source (JSON)"
                >
                  <FileJson size={12} />
                </button>
              </div>

              <div className="absolute bottom-1 left-1 rounded bg-black/40 px-1 py-0.5 text-[8px] text-[#8888aa]">
                {gen.width}x{gen.height}
              </div>
            </div>
            <span className="truncate text-[9px] text-[#8888aa] group-hover:text-purple-300">
              {gen.prompt}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

const PixelLabCopilotSection = () => {
  const { 
    prompt, 
    setPrompt, 
    error, 
    isLoading, 
    handleApply, 
    generations, 
    handleSelectGeneration,
    genSize,
    setGenSize,
    downloadImage,
    downloadSource
  } = usePixelLabCopilot()
  const { handleInject, isLoading: isInjecting } = useDemoSprite()
  
  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <textarea
          value={prompt}
          onChange={(e) => setPrompt(e.target.value)}
          rows={4}
          placeholder="A cute dragon, 8-bit style..."
          onKeyDown={(e) => e.stopPropagation()}
          onPaste={(e) => e.stopPropagation()}
          className="w-full resize-y rounded border border-white/10 bg-[#1a1a2e] p-2 font-mono text-[11px] text-[#ededed] placeholder:text-[#444466] focus:border-purple-500/40 focus:outline-none focus:ring-1 focus:ring-purple-500/40"
        />
        {isLoading && (
          <div className="absolute right-2 top-2">
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-purple-500 border-t-transparent" />
          </div>
        )}
      </div>
      
      {error && <p className="text-[10px] text-red-400">{error}</p>}
      
      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] text-[#8888aa]">Resolution</label>
          <select
            value={genSize}
            onChange={(e) => setGenSize(Number(e.target.value))}
            className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-2 text-xs text-[#ededed] focus:outline-none"
          >
            {[32].map(size => (
              <option key={size} value={size}>{size}x{size}</option>
            ))}
          </select>
        </div>
        <div className="flex-[2] flex flex-col justify-end">
          <button
            type="button"
            onClick={handleApply}
            disabled={!prompt.trim() || isLoading}
            className="w-full rounded border border-purple-500/20 bg-purple-500/10 py-2 text-xs font-medium text-purple-400 transition-colors hover:bg-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isLoading ? 'Generating...' : 'Generate'}
          </button>
        </div>
      </div>

      <PixelLabHistory 
        generations={generations} 
        onSelect={handleSelectGeneration}
        onDownload={downloadImage}
        onDownloadSource={downloadSource}
      />
      
      <div className="mt-2 border-t border-white/5 pt-2">
        <button
          type="button"
          onClick={handleInject}
          className="w-full rounded border border-white/10 bg-[#1a1a2e] py-1 text-[10px] text-[#8888aa] transition-colors hover:bg-white/5"
        >
          {isInjecting ? 'Injecting...' : 'Test: Inject Demo Sprite'}
        </button>
      </div>
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

      <CollapsibleSection title="AI Copilot" defaultOpen={true} icon={<Sparkles size={16} className="text-purple-400" />}>
        <PixelLabCopilotSection />
      </CollapsibleSection>


    </div>
  )
}
