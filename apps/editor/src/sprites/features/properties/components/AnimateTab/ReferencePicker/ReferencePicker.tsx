import { ModalPortal } from '@/components/ModalPortal/ModalPortal'
import { useReferencePicker } from './useReferencePicker.hook'
import { REFERENCE_PICKER_TILE, SECONDARY_BUTTON } from '../animate-tab.classes'
import {
  ANIMATION_REFERENCE_ASSETS_EMPTY,
  ANIMATION_REFERENCE_CANVAS_EMPTY,
  ANIMATION_REFERENCE_CLOSE_LABEL,
  ANIMATION_REFERENCE_PICKER_DESCRIPTION,
  ANIMATION_REFERENCE_PICKER_TITLE,
  ANIMATION_REFERENCE_SOURCE_ASSETS,
  ANIMATION_REFERENCE_SOURCE_CANVAS,
} from '@/constants/animation'
import { MOTION } from '@/constants/motion'
import { Z_INDEX } from '@/constants/z-index'

interface ReferencePickerProps {
  readonly onClose: () => void
}

const tabButtonClass = (isActive: boolean) =>
  `flex-1 rounded-sm px-3 py-1.5 text-xs font-medium ${MOTION.COLORS} ${
    isActive ? 'bg-ai/15 text-ai-ink' : 'text-muted hover:text-ink'
  }`

/** Canvas-frame and Assets picker for the Animate tab's locked reference (ADR 0011). */
export const ReferencePicker = ({ onClose }: ReferencePickerProps) => {
  const {
    dialogRef,
    titleId,
    descriptionId,
    activeTab,
    setActiveTab,
    canvasFrames,
    assetItems,
    handlePickCanvasFrame,
    handlePickAsset,
    handleBackdropClick,
    handleKeyDown,
  } = useReferencePicker({ onClose })

  return (
    <ModalPortal>
      <div
        onClick={handleBackdropClick}
        className={`fixed inset-0 ${Z_INDEX.MODAL} flex items-center justify-center bg-sunken/70 backdrop-blur-sm ${MOTION.FADE_ENTER}`}
      >
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          tabIndex={-1}
          onKeyDown={handleKeyDown}
          className={`flex w-full max-w-md flex-col gap-3 rounded-md border border-line-strong bg-raised p-5 shadow-popover outline-none ${MOTION.ENTER}`}
        >
          <h2 id={titleId} className="text-sm font-semibold text-ink">
            {ANIMATION_REFERENCE_PICKER_TITLE}
          </h2>
          <p id={descriptionId} className="text-xs leading-relaxed text-muted">
            {ANIMATION_REFERENCE_PICKER_DESCRIPTION}
          </p>

          <div className="flex gap-1 rounded-sm border border-line-strong bg-sunken p-1">
            <button type="button" onClick={() => setActiveTab('canvas')} className={tabButtonClass(activeTab === 'canvas')}>
              {ANIMATION_REFERENCE_SOURCE_CANVAS}
            </button>
            <button type="button" onClick={() => setActiveTab('assets')} className={tabButtonClass(activeTab === 'assets')}>
              {ANIMATION_REFERENCE_SOURCE_ASSETS}
            </button>
          </div>

          <div className="grid max-h-64 grid-cols-4 gap-2 overflow-y-auto">
            {activeTab === 'canvas' &&
              (canvasFrames.length > 0 ? (
                canvasFrames.map((frame) => (
                  <button
                    key={frame.frameIndex}
                    type="button"
                    onClick={() => handlePickCanvasFrame(frame)}
                    title={frame.label}
                    aria-label={frame.label}
                    className={REFERENCE_PICKER_TILE}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available */}
                    <img src={frame.thumbnailSrc} alt="" className="image-pixelated h-full w-full object-contain" />
                  </button>
                ))
              ) : (
                <p className="col-span-4 text-xs text-subtle">{ANIMATION_REFERENCE_CANVAS_EMPTY}</p>
              ))}

            {activeTab === 'assets' &&
              (assetItems.length > 0 ? (
                assetItems.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => handlePickAsset(item)}
                    title={item.label}
                    aria-label={item.label}
                    className={REFERENCE_PICKER_TILE}
                  >
                    {item.thumbnailSrc && (
                      // eslint-disable-next-line @next/next/no-img-element -- Vite SPA, no next/image available
                      <img src={item.thumbnailSrc} alt="" className="image-pixelated h-full w-full object-contain" />
                    )}
                  </button>
                ))
              ) : (
                <p className="col-span-4 text-xs text-subtle">{ANIMATION_REFERENCE_ASSETS_EMPTY}</p>
              ))}
          </div>

          <div className="flex justify-end">
            <button type="button" onClick={onClose} className={SECONDARY_BUTTON}>
              {ANIMATION_REFERENCE_CLOSE_LABEL}
            </button>
          </div>
        </div>
      </div>
    </ModalPortal>
  )
}
