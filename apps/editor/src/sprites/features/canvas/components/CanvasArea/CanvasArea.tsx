import { useRef, useEffect, useState } from 'react'
import { Stage } from 'react-konva'

import { useCanvasInteraction } from '../../hooks/useCanvasInteraction.hook'
import { useCanvasZoom } from '../../hooks/useCanvasZoom.hook'
import { useKeyboardShortcuts } from '@/sprites/hooks/useKeyboardShortcuts.hook'
import { GridBackground } from '@/sprites/features/canvas/components/CanvasArea/konva/GridBackground'
import { GridOverlay } from '@/sprites/features/canvas/components/CanvasArea/konva/GridOverlay'
import { SpriteLayers } from '@/sprites/features/canvas/components/CanvasArea/konva/SpriteLayers'
import { SelectionOverlay } from '@/sprites/features/canvas/components/CanvasArea/konva/SelectionOverlay'

import {
  useLayers,
  useViewport,
  useCanvasDimensions,
  useSelection,
  useActiveLayerId,
  useShowGrid,
  useOnionSkinEnabled,
  useTimeline,
  useLayerRevisions,
} from '@/sprites/hooks/useSpriteEditorStore.hook'

export const CanvasArea = () => {
  const containerRef = useRef<HTMLDivElement>( null )
  const [ size, setSize ] = useState( { width: 0, height: 0 } )

  const layers = useLayers()
  const viewport = useViewport()
  const canvasDimensions = useCanvasDimensions()
  const selection = useSelection()
  const activeLayerId = useActiveLayerId()
  const showGrid = useShowGrid()
  const onionSkinEnabled = useOnionSkinEnabled()
  const timeline = useTimeline()
  const layerRevisions = useLayerRevisions()

  // Build previous-frame layers for onion skin
  const previousFrameLayers = (() => {
    if (!onionSkinEnabled) return null
    const prevIndex = timeline.currentFrameIndex - 1
    if (prevIndex < 0) return null
    const prevFrame = timeline.frames[prevIndex]
    if (!prevFrame) return null
    return prevFrame.layers
  })()

  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave } = useCanvasInteraction()
  const { handleWheel } = useCanvasZoom()

  useKeyboardShortcuts()

  useEffect( () => {
    if ( !containerRef.current ) return
    const observer = new ResizeObserver( ( entries ) => {
      const entry = entries[ 0 ]
      if ( entry ) {
        setSize( {
          width: Math.floor( entry.contentRect.width ),
          height: Math.floor( entry.contentRect.height ),
        } )
      }
    } )
    observer.observe( containerRef.current )
    setSize( {
      width: Math.floor( containerRef.current.clientWidth ),
      height: Math.floor( containerRef.current.clientHeight ),
    } )
    return () => observer.disconnect()
  }, [] )

  return (
    <div ref={ containerRef } className="h-full w-full overflow-hidden bg-transparent" style={{ imageRendering: 'pixelated' }}>
      { size.width > 0 && size.height > 0 && (
        <Stage
          width={ size.width }
          height={ size.height }
          onMouseDown={ handlePointerDown }
          onTouchStart={ handlePointerDown }
          onMouseMove={ handlePointerMove }
          onTouchMove={ handlePointerMove }
          onMouseUp={ handlePointerUp }
          onTouchEnd={ handlePointerUp }
          onMouseLeave={ handlePointerLeave }
          onWheel={ handleWheel }
          className="cursor-crosshair block"
          style={ { touchAction: 'none', imageRendering: 'pixelated' } }
        >
          <GridBackground
            viewport={ viewport }
            gridWidth={ canvasDimensions.width }
            gridHeight={ canvasDimensions.height }
            canvasElWidth={ size.width }
            canvasElHeight={ size.height }
          />

          <SpriteLayers
            layers={ layers }
            viewport={ viewport }
            gridWidth={ canvasDimensions.width }
            gridHeight={ canvasDimensions.height }
            canvasElWidth={ size.width }
            canvasElHeight={ size.height }
            activeLayerId={ activeLayerId }
            selection={ selection }
            onionSkinEnabled={ onionSkinEnabled }
            previousFrameLayers={ previousFrameLayers }
            layerRevisions={ layerRevisions }
          />

          { showGrid && (
            <GridOverlay
              viewport={ viewport }
              gridWidth={ canvasDimensions.width }
              gridHeight={ canvasDimensions.height }
              canvasElWidth={ size.width }
              canvasElHeight={ size.height }
            />
          ) }

          { selection && (
            <SelectionOverlay
              selection={ selection }
              viewport={ viewport }
              gridWidth={ canvasDimensions.width }
              gridHeight={ canvasDimensions.height }
              canvasElWidth={ size.width }
              canvasElHeight={ size.height }
            />
          ) }
        </Stage>
      ) }
    </div>
  )
}
