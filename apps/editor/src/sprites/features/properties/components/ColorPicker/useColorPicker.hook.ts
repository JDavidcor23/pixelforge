import { useCallback, useMemo, useState } from 'react'
import { colord } from 'colord'

import { hexToHsv, hsvToHex } from '@/lib'
import {
  usePrimaryColor,
  useSecondaryColor,
  useSetPrimaryColor,
  useSetSecondaryColor,
} from '@/sprites/hooks/useSpriteEditorStore.hook'
import type { HsvColor, RgbaColor } from '@/types'

type ActiveColorType = 'primary' | 'secondary'

const rgbaToHex = (color: RgbaColor): string =>
  colord({ r: color.r, g: color.g, b: color.b, a: color.a / 255 }).toHex()

const hexToRgba = (hex: string): RgbaColor => {
  const rgba = colord(hex).toRgb()
  return { r: rgba.r, g: rgba.g, b: rgba.b, a: Math.round(rgba.a * 255) }
}

export const useColorPicker = () => {
  const primaryColor = usePrimaryColor()
  const secondaryColor = useSecondaryColor()
  const setPrimaryColor = useSetPrimaryColor()
  const setSecondaryColor = useSetSecondaryColor()
  const [activeColorType, setActiveColorType] = useState<ActiveColorType>('primary')

  const primaryHex = useMemo(() => rgbaToHex(primaryColor), [primaryColor])
  const secondaryHex = useMemo(() => rgbaToHex(secondaryColor), [secondaryColor])
  const activeColorHex = activeColorType === 'primary' ? primaryHex : secondaryHex

  // Sticky-hue HSV: kept as local state rather than derived fresh from the
  // hex every render. A hex alone can't represent hue once it's achromatic
  // (black, white, any pure gray) — deriving hue straight from the hex would
  // snap the hue slider back to red whenever the user drags the SV square to
  // value 0 or saturation 0. Local HSV is the source of truth while the user
  // drags the SV square / hue slider. When the active hex changes from
  // OUTSIDE this hook (eyedropper, palette click, hex/RGBA input, swap,
  // switching primary/secondary), `syncedHex` no longer matches and we
  // re-derive from the new hex, falling back to the previous hue if the new
  // color is achromatic. This is React's "adjust state during render" escape
  // hatch — not an effect — so there's no flicker frame with the wrong hue.
  const [hsv, setHsv] = useState<HsvColor>(() => hexToHsv(activeColorHex, 0))
  const [syncedHex, setSyncedHex] = useState(activeColorHex)
  if (activeColorHex !== syncedHex) {
    setSyncedHex(activeColorHex)
    setHsv(hexToHsv(activeColorHex, hsv.h))
  }

  const handleColorChange = useCallback(
    (newHex: string) => {
      const rgba = hexToRgba(newHex)
      if (activeColorType === 'primary') setPrimaryColor(rgba)
      else setSecondaryColor(rgba)
    },
    [activeColorType, setPrimaryColor, setSecondaryColor],
  )

  const handleSvChange = useCallback(
    (saturation: number, value: number) => {
      const nextHsv: HsvColor = { ...hsv, s: saturation, v: value }
      const nextHex = hsvToHex(nextHsv)
      setHsv(nextHsv)
      setSyncedHex(nextHex)
      handleColorChange(nextHex)
    },
    [hsv, handleColorChange],
  )

  const handleHueChange = useCallback(
    (hue: number) => {
      const nextHsv: HsvColor = { ...hsv, h: hue }
      const nextHex = hsvToHex(nextHsv)
      setHsv(nextHsv)
      setSyncedHex(nextHex)
      handleColorChange(nextHex)
    },
    [hsv, handleColorChange],
  )

  const handleSelectActiveColor = useCallback((type: ActiveColorType) => setActiveColorType(type), [])

  const handleSwapColors = useCallback(() => {
    setPrimaryColor(secondaryColor)
    setSecondaryColor(primaryColor)
  }, [primaryColor, secondaryColor, setPrimaryColor, setSecondaryColor])

  return {
    primaryHex,
    secondaryHex,
    activeColorHex,
    activeColorType,
    hue: hsv.h,
    saturation: hsv.s,
    value: hsv.v,
    handleColorChange,
    handleSvChange,
    handleHueChange,
    handleSelectActiveColor,
    handleSwapColors,
  }
}
