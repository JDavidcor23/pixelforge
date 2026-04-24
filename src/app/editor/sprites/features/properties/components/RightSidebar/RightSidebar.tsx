'use client'

import { useState } from 'react'
import { Sparkles, Palette, Download, Code, FileJson, Key, Settings2, ExternalLink } from 'lucide-react'
import Link from 'next/link'

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
    downloadSource,
    apiKey,
    setApiKey
  } = usePixelLabCopilot()
  const { handleInject, isLoading: isInjecting } = useDemoSprite()
  const [isConfigOpen, setIsConfigOpen] = useState(false)
  
  const isMissingKey = !apiKey && error?.includes('Missing PixelLab API Key')

  return (
    <div className="flex flex-col gap-3">
      {/* Configuration Header/Toggle */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <div className={`h-1.5 w-1.5 rounded-full ${apiKey ? 'bg-green-500' : 'bg-yellow-500 animate-pulse'}`} />
          <span className="text-[10px] uppercase tracking-wider text-[#8888aa]">
            {apiKey ? 'PixelLab Connected' : 'Setup Required'}
          </span>
        </div>
        <button 
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`rounded p-1 transition-colors ${isConfigOpen ? 'bg-purple-500/20 text-purple-400' : 'text-[#444466] hover:text-[#8888aa]'}`}
          title="PixelLab Settings"
        >
          <Settings2 size={14} />
        </button>
      </div>

      {/* API Key Configuration Panel */}
      {isConfigOpen && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-[10px] font-medium text-purple-300/80">API Configuration</label>
            <Link 
              href="/docs/pixellab" 
              className="flex items-center gap-1 text-[10px] text-[#8888aa] hover:text-[#00f5ff] transition-colors"
              target="_blank"
            >
              How to get a key? <ExternalLink size={10} />
            </Link>
          </div>
          <div className="relative">
            <Key className="absolute left-2 top-1/2 -translate-y-1/2 text-[#444466]" size={12} />
            <input
              type="password"
              value={apiKey || ''}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="Paste your API key here..."
              className="w-full rounded border border-white/10 bg-[#0a0a0f] py-1.5 pl-8 pr-2 text-xs text-[#ededed] placeholder:text-[#333344] focus:border-purple-500/50 focus:outline-none"
            />
          </div>
          <p className="mt-2 text-[9px] text-[#444466] leading-tight text-center">
            Your key is saved locally in your browser. <br/>
            We don't store it on our servers.
          </p>
        </div>
      )}

      {!apiKey && !isConfigOpen && (
        <button
          onClick={() => setIsConfigOpen(true)}
          className="flex items-center justify-center gap-2 rounded-lg border border-yellow-500/20 bg-yellow-500/5 py-3 text-xs font-medium text-yellow-500/80 transition-all hover:bg-yellow-500/10"
        >
          <Key size={14} />
          Configure PixelLab to start
        </button>
      )}

      <div className={`flex flex-col gap-2 ${(!apiKey && !isConfigOpen) ? 'opacity-20 pointer-events-none grayscale' : ''}`}>
        <div className="relative">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
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
        
        {error && (
          <div className="flex flex-col gap-1 rounded border border-red-500/20 bg-red-500/5 p-2">
            <p className="text-[10px] text-red-400">{error}</p>
            {isMissingKey && (
              <button 
                onClick={() => setIsConfigOpen(true)}
                className="text-left text-[9px] font-bold text-red-300 underline underline-offset-2"
              >
                Set API key now
              </button>
            )}
          </div>
        )}
        
        <div className="flex gap-2">
          <div className="flex-1">
            <label className="mb-1 block text-[10px] text-[#8888aa]">Resolution</label>
            <select
              value={genSize}
              onChange={(e) => setGenSize(Number(e.target.value))}
              className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-2 text-xs text-[#ededed] focus:outline-none"
            >
              {[32, 64, 128].map(size => (
                <option key={size} value={size}>{size}x{size}</option>
              ))}
            </select>
          </div>
          <div className="flex-[2] flex flex-col justify-end">
            <button
              type="button"
              onClick={handleApply}
              disabled={!prompt.trim() || isLoading || !apiKey}
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
