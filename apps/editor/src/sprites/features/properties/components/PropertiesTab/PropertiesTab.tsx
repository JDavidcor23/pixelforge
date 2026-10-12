import { Droplet, Move, Palette } from 'lucide-react'

import { CollapsibleSection } from '../CollapsibleSection/CollapsibleSection'
import { ColorPicker } from '../ColorPicker/ColorPicker'
import { OpacitySlider } from '../OpacitySlider/OpacitySlider'
import { PositionFields } from '../PositionFields/PositionFields'
import { usePropertiesTab } from './usePropertiesTab.hook'

export const PropertiesTab = () => {
  const { activeLayerOpacity, handleOpacityChange } = usePropertiesTab()

  return (
    <div className="flex flex-col gap-5">
      <CollapsibleSection title="Position" icon={<Move size={12} aria-hidden />}>
        <PositionFields />
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
