import { useState } from 'react'
import { Sparkles, Palette, Download, FileJson, Key, Settings2, ExternalLink, Check, Film, Upload } from 'lucide-react'

import { OpacitySlider } from '../OpacitySlider/OpacitySlider'
import { ColorInputs } from '../ColorInputs/ColorInputs'
import { ColorArea } from '../ColorArea/ColorArea'
import { ColorPalette } from '../ColorPalette/ColorPalette'
import { CollapsibleSection } from './CollapsibleSection'
import {
  useRightSidebar,
  useColorSection,
  useSpriteCopilot,
  useAnimationGenerator,
  useSpriteImport,
  type AIGeneration,
  type AIAnimation,
} from './useRightSidebar.hook'
import { useExport } from './useExport.hook'
import { useCursorPixel } from '@/sprites/hooks/useSpriteEditorStore.hook'
import {
  AI_SPRITE_SIZES,
  SPRITE_ANIMATION,
  SPRITE_IMPORT_ACCEPT,
  SPRITE_IMPORT_MIN_FRAMES,
  SPRITE_IMPORT_MAX_FRAMES,
} from '@/constants'

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


const GenerationHistory = ({ 
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

const RecentAnimations = ({
  animations,
  onSelect,
  onDownload,
  sheetsAvailableForDownload,
}: {
  animations: AIAnimation[]
  onSelect: (anim: AIAnimation) => void
  onDownload: (anim: AIAnimation) => void
  sheetsAvailableForDownload: Set<string>
}) => {
  if (animations.length === 0) return null

  return (
    <div className="mt-4">
      <div className="mb-2 text-[10px] uppercase tracking-wider text-[#8888aa]">Recent Animations</div>
      <div className="grid grid-cols-2 gap-2">
        {animations.map((anim) => {
          const hasOriginal = sheetsAvailableForDownload.has(anim.id)
          return (
            <div
              key={anim.id}
              className="group relative flex flex-col gap-1 overflow-hidden rounded border border-white/5 bg-[#1a1a2e] p-1.5 transition-all hover:border-cyan-500/40"
            >
              <div className="aspect-square relative w-full overflow-hidden rounded bg-black/20">
                {/* eslint-disable-next-line @next/next/no-img-element -- matches GenerationHistory's sibling pattern above */}
                <img
                  src={anim.frames[0]}
                  alt={anim.label}
                  className="h-full w-full object-contain image-pixelated cursor-pointer"
                  onClick={() => onSelect(anim)}
                />

                <div className="absolute right-1 top-1 opacity-0 transition-opacity group-hover:opacity-100">
                  <button
                    onClick={(e) => { e.stopPropagation(); if (hasOriginal) onDownload(anim) }}
                    disabled={!hasOriginal}
                    className="rounded bg-black/60 p-1 text-white hover:bg-cyan-600 disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-black/60"
                    title={hasOriginal ? 'Download original sheet' : 'Original sheet only available for animations generated this session'}
                  >
                    <Download size={12} />
                  </button>
                </div>
              </div>
              <span className="truncate text-[9px] text-[#8888aa] group-hover:text-cyan-300">
                {anim.label}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

const ImportSpriteSection = () => {
  const {
    frameCount,
    setFrameCount,
    size,
    setSize,
    isSheet,
    isImporting,
    error,
    fileInputRef,
    handleOpenFilePicker,
    handleFileSelected,
  } = useSpriteImport()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 border-b border-white/5 pb-2">
        <Upload size={14} className="text-emerald-400" />
        <span className="text-[10px] uppercase tracking-wider text-[#8888aa]">Upload PNG</span>
      </div>

      <p className="text-[10px] text-[#8888aa]">
        Subí una imagen PNG (por ejemplo un sprite que descargaste y editaste a mano). Vos declarás cuántos
        frames tiene y a qué resolución entra — el editor obedece, no adivina.
      </p>

      <div className="flex gap-2">
        <div className="flex-1">
          <label className="mb-1 block text-[10px] text-[#8888aa]">Frames</label>
          <input
            type="number"
            min={SPRITE_IMPORT_MIN_FRAMES}
            max={SPRITE_IMPORT_MAX_FRAMES}
            value={frameCount}
            onChange={(e) => setFrameCount(Number(e.target.value))}
            onKeyDown={(e) => e.stopPropagation()}
            className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-2 text-xs text-[#ededed] focus:outline-none"
          />
        </div>
        <div className="flex-1">
          <label className="mb-1 block text-[10px] text-[#8888aa]">Resolution</label>
          <select
            value={size}
            onChange={(e) => setSize(Number(e.target.value))}
            className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-2 text-xs text-[#ededed] focus:outline-none"
          >
            {AI_SPRITE_SIZES.map((s) => (
              <option key={s} value={s}>{s}x{s}</option>
            ))}
          </select>
        </div>
      </div>

      {error && (
        <div className="rounded border border-red-500/20 bg-red-500/5 p-2">
          <p className="text-[10px] text-red-400">{error}</p>
        </div>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept={SPRITE_IMPORT_ACCEPT}
        onChange={handleFileSelected}
        className="hidden"
      />

      <button
        type="button"
        onClick={handleOpenFilePicker}
        disabled={isImporting}
        className="flex w-full items-center justify-center gap-2 rounded border border-emerald-500/20 bg-emerald-500/10 py-2.5 text-xs font-medium text-emerald-400 transition-colors hover:bg-emerald-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isImporting ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-emerald-400 border-t-transparent" />
            Importing…
          </>
        ) : (
          <>
            <Upload size={14} />
            {isSheet ? 'Import Sheet' : 'Import Sprite'}
          </>
        )}
      </button>
    </div>
  )
}

const SpriteCopilotSection = () => {
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
    tempApiKey,
    setTempApiKey,
    handleSaveApiKey
  } = useSpriteCopilot()
  const [isConfigOpen, setIsConfigOpen] = useState(false)

  return (
    <div className="flex flex-col gap-3">
      {/* Configuration Header/Toggle */}
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-1.5 rounded-full bg-green-500" />
          <span className="text-[10px] uppercase tracking-wider text-[#8888aa]">
            Retro Diffusion
          </span>
        </div>
        <button
          onClick={() => setIsConfigOpen(!isConfigOpen)}
          className={`rounded p-1 transition-colors ${isConfigOpen ? 'bg-purple-500/20 text-purple-400' : 'text-[#444466] hover:text-[#8888aa]'}`}
          title="Retro Diffusion API key"
        >
          <Settings2 size={14} />
        </button>
      </div>

      {/* API Key Configuration Panel */}
      {isConfigOpen && (
        <div className="rounded-lg border border-purple-500/20 bg-purple-500/5 p-3 animate-in fade-in slide-in-from-top-1 duration-200">
          <div className="mb-3 flex items-center justify-between">
            <label className="text-[10px] font-medium text-purple-300/80">API Configuration</label>
            <a
              href="https://www.retrodiffusion.ai/app/guide/api"
              className="flex items-center gap-1 text-[10px] text-[#8888aa] hover:text-[#00f5ff] transition-colors"
              target="_blank"
              rel="noopener noreferrer"
            >
              How to get a key? <ExternalLink size={10} />
            </a>
          </div>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Key className="absolute left-2 top-1/2 -translate-y-1/2 text-[#444466]" size={12} />
              <input
                type="password"
                value={tempApiKey}
                onChange={(e) => setTempApiKey(e.target.value)}
                onKeyDown={(e) => {
                  e.stopPropagation()
                  if (e.key === 'Enter') handleSaveApiKey()
                }}
                onPaste={(e) => e.stopPropagation()}
                placeholder="Paste your API key here..."
                className="w-full rounded border border-white/10 bg-[#0a0a0f] py-1.5 pl-8 pr-2 text-xs text-[#ededed] placeholder:text-[#333344] focus:border-purple-500/50 focus:outline-none"
              />
            </div>
            <button
              onClick={handleSaveApiKey}
              disabled={tempApiKey === (apiKey || '')}
              className={`flex items-center justify-center rounded px-3 transition-all ${
                tempApiKey === (apiKey || '') && apiKey
                  ? 'bg-green-500/20 text-green-400 border border-green-500/20'
                  : 'bg-purple-500/20 text-purple-400 border border-purple-500/20 hover:bg-purple-500/30'
              } disabled:opacity-50 disabled:cursor-default`}
            >
              {tempApiKey === (apiKey || '') && apiKey ? <Check size={14} /> : <span className="text-[10px] font-bold">SAVE</span>}
            </button>
          </div>
          <p className="mt-2 text-[9px] text-[#444466] leading-tight text-center">
            Your key is saved locally in your browser. <br/>
            We don't store it on our servers.
          </p>
        </div>
      )}

      <div className="flex flex-col gap-2">
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
              {AI_SPRITE_SIZES.map(size => (
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
              {isLoading ? 'Generating…' : 'Generate'}
            </button>
          </div>
        </div>

        {isLoading && (
          <p className="text-center text-[9px] text-[#8888aa]">
            Retro Diffusion is drawing your sprite — a few seconds.
          </p>
        )}

        <GenerationHistory
          generations={generations} 
          onSelect={handleSelectGeneration}
          onDownload={downloadImage}
          onDownloadSource={downloadSource}
        />
        
      </div>
    </div>
  )
}

const AnimationGeneratorSection = () => {
  const {
    action,
    setAction,
    direction,
    setDirection,
    nFrames,
    setNFrames,
    isGenerating,
    animError,
    handleGenerateAnimation,
    previewRef,
    handlePreviewReference,
    animations,
    handleSelectAnimation,
    downloadAnimationSheet,
    sheetsAvailableForDownload,
  } = useAnimationGenerator()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between border-b border-white/5 pb-2">
        <div className="flex items-center gap-2">
          <Film size={14} className="text-cyan-400" />
          <span className="text-[10px] uppercase tracking-wider text-[#8888aa]">Animate Sprite</span>
        </div>
        <button
          onClick={handlePreviewReference}
          className="text-[9px] font-bold text-cyan-400/60 hover:text-cyan-400 uppercase tracking-tighter"
        >
          Test Upscale
        </button>
      </div>

      {previewRef && (
        <div className="flex flex-col items-center gap-2 rounded border border-white/5 bg-black/20 p-2">
          <span className="text-[9px] text-[#555577] uppercase font-bold tracking-widest">AI Input Preview (64x64)</span>
          <img
            src={previewRef}
            alt="Reference Preview"
            className="h-16 w-16 image-pixelated border border-white/10 shadow-lg"
          />
        </div>
      )}

      <p className="text-[10px] text-[#8888aa]">
        Retro Diffusion usa el frame actual como referencia exacta del personaje y genera los frames elegidos.
      </p>

      <div className="grid grid-cols-2 gap-2">
        <div>
          <label className="mb-1 block text-[10px] text-[#8888aa]">Action</label>
          <select
            value={action}
            onChange={(e) => setAction(e.target.value as typeof action)}
            className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-1.5 text-xs text-[#ededed] focus:outline-none"
          >
            {SPRITE_ANIMATION.ACTIONS.map((a) => (
              <option key={a} value={a}>
                {a.charAt(0).toUpperCase() + a.slice(1)}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="mb-1 block text-[10px] text-[#8888aa]">Direction</label>
          <select
            value={direction}
            onChange={(e) => setDirection(e.target.value as typeof direction)}
            className="w-full rounded border border-white/10 bg-[#1a1a2e] px-2 py-1.5 text-xs text-[#ededed] focus:outline-none"
          >
            {SPRITE_ANIMATION.DIRECTIONS.map((d) => (
              <option key={d} value={d}>
                {d.split('-').map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ')}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div>
        <label className="mb-1 block text-[10px] text-[#8888aa]">Frames</label>
        <div className="flex gap-1">
          {SPRITE_ANIMATION.FRAME_OPTIONS.map((n) => (
            <button
              key={n}
              type="button"
              onClick={() => setNFrames(n)}
              className={`flex-1 rounded border py-1 text-[11px] font-medium transition-all ${
                nFrames === n
                  ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-400'
                  : 'border-white/10 bg-[#1a1a2e] text-[#8888aa] hover:border-white/20'
              }`}
            >
              {n}
            </button>
          ))}
        </div>
      </div>

      {animError && (
        <div className="rounded border border-red-500/20 bg-red-500/5 p-2">
          <p className="text-[10px] text-red-400">{animError}</p>
        </div>
      )}

      <button
        type="button"
        onClick={handleGenerateAnimation}
        disabled={isGenerating}
        className="flex w-full items-center justify-center gap-2 rounded border border-cyan-500/20 bg-gradient-to-r from-cyan-500/10 to-purple-500/10 py-2.5 text-xs font-medium text-cyan-400 transition-all hover:from-cyan-500/20 hover:to-purple-500/20 disabled:cursor-not-allowed disabled:opacity-40"
      >
        {isGenerating ? (
          <>
            <div className="h-3 w-3 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            Generating...
          </>
        ) : (
          <>
            <Film size={14} />
            Generate Animation
          </>
        )}
      </button>

      <RecentAnimations
        animations={animations}
        onSelect={handleSelectAnimation}
        onDownload={downloadAnimationSheet}
        sheetsAvailableForDownload={sheetsAvailableForDownload}
      />
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

      <CollapsibleSection title="Import Sprite" defaultOpen={false} icon={<Upload size={16} className="text-emerald-400" />}>
        <ImportSpriteSection />
      </CollapsibleSection>

      <CollapsibleSection title="AI Copilot" defaultOpen={true} icon={<Sparkles size={16} className="text-purple-400" />}>
        <SpriteCopilotSection />
      </CollapsibleSection>

      <CollapsibleSection title="AI Animation" defaultOpen={false} icon={<Film size={16} className="text-cyan-400" />}>
        <AnimationGeneratorSection />
      </CollapsibleSection>


    </div>
  )
}
