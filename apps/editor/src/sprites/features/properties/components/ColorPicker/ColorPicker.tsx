import { memo } from 'react'
import { ArrowLeftRight } from 'lucide-react'

import { ColorInputs } from '../ColorInputs/ColorInputs'
import { ColorPalette } from '../ColorPalette/ColorPalette'
import { HueSlider } from '../HueSlider/HueSlider'
import { SaturationValueSquare } from '../SaturationValueSquare/SaturationValueSquare'
import { useColorPicker } from './useColorPicker.hook'
import { FOCUS_RING } from '@/constants/focus-ring'
import { MOTION } from '@/constants/motion'

const SWATCH = 'size-8 shrink-0 rounded-sm border-2'
const SECTION_LABEL = 'font-mono text-3xs uppercase tracking-wider text-subtle'

// Takes no props and reads everything from the store via `useColorPicker` —
// memoized so a PropertiesTab re-render (e.g. the opacity slider changing)
// doesn't re-render this subtree too; it still re-renders on its own when the
// store values it subscribes to change.
export const ColorPicker = memo(function ColorPicker() {
  const {
    primaryHex,
    secondaryHex,
    activeColorHex,
    activeColorType,
    hue,
    saturation,
    value,
    handleColorChange,
    handleSvChange,
    handleHueChange,
    handleSelectActiveColor,
    handleSwapColors,
  } = useColorPicker()

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <button
          type="button"
          onClick={() => handleSelectActiveColor('primary')}
          aria-pressed={activeColorType === 'primary'}
          className={`${SWATCH} ${activeColorType === 'primary' ? 'border-accent' : 'border-line-strong'}`}
          style={{ backgroundColor: primaryHex }}
          title="Primary color"
        />
        <button
          type="button"
          onClick={() => handleSelectActiveColor('secondary')}
          aria-pressed={activeColorType === 'secondary'}
          className={`${SWATCH} ${activeColorType === 'secondary' ? 'border-accent' : 'border-line-strong'}`}
          style={{ backgroundColor: secondaryHex }}
          title="Secondary color"
        />
        <button
          type="button"
          onClick={handleSwapColors}
          aria-label="Swap colors"
          title="Swap colors"
          className={`flex size-7 shrink-0 items-center justify-center rounded text-muted hover:text-ink ${MOTION.COLORS} ${FOCUS_RING.SURFACE}`}
        >
          <ArrowLeftRight size={14} aria-hidden />
        </button>
        <span className={`${SECTION_LABEL} truncate`}>Editing · {activeColorType}</span>
      </div>

      <SaturationValueSquare hue={hue} saturation={saturation} value={value} onChange={handleSvChange} />
      <HueSlider hue={hue} onChange={handleHueChange} />
      <ColorInputs color={activeColorHex} onChange={handleColorChange} />

      <div className="flex flex-col gap-2">
        <span className={SECTION_LABEL}>Saved colors</span>
        <ColorPalette />
      </div>
    </div>
  )
})
