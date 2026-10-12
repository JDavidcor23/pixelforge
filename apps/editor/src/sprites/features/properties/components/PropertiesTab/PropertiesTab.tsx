import { Droplet, Move, Palette } from 'lucide-react'

import { CollapsibleSection } from '../CollapsibleSection/CollapsibleSection'
import { ColorPicker } from '../ColorPicker/ColorPicker'
import { OpacitySlider } from '../OpacitySlider/OpacitySlider'
import { usePropertiesTab } from './usePropertiesTab.hook'

const FIELD =
  'h-8 w-full rounded border border-line bg-base pl-6 pr-2 font-mono text-xs text-ink outline-none focus:border-accent'
const PREFIX =
  'pointer-events-none absolute left-2 top-1/2 -translate-y-1/2 font-mono text-2xs text-subtle'

export const PropertiesTab = () => {
  const { cursorPixel, activeLayerOpacity, handleOpacityChange } = usePropertiesTab()

  return (
    <div className="flex flex-col gap-5">
      <CollapsibleSection title="Position" icon={<Move size={12} aria-hidden />}>
        <div className="flex gap-2">
          <div className="relative flex-1">
            <span className={PREFIX}>X</span>
            <input type="text" readOnly value={cursorPixel?.x ?? '—'} className={FIELD} />
          </div>
          <div className="relative flex-1">
            <span className={PREFIX}>Y</span>
            <input type="text" readOnly value={cursorPixel?.y ?? '—'} className={FIELD} />
          </div>
        </div>
      </CollapsibleSection>

      <CollapsibleSection title="Opacity" icon={<Droplet size={12} aria-hidden />}>
        <OpacitySlider value={activeLayerOpacity} onChange={handleOpacityChange} />
      </CollapsibleSection>

      <CollapsibleSection title="Color" icon={<Palette size={12} aria-hidden />}>
        <ColorPicker />
      </CollapsibleSection>
    </div>
  )
}
