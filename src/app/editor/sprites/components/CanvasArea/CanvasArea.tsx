'use client'

import { useRef, useEffect, useState } from 'react'
import { Stage } from 'react-konva'

import { useCanvasInteraction } from '../../hooks/useCanvasInteraction.hook'
import { useCanvasZoom } from '../../hooks/useCanvasZoom.hook'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts.hook'
import { GridBackground } from './konva/GridBackground'
import { SpriteLayers } from './konva/SpriteLayers'
import { SelectionOverlay } from './konva/SelectionOverlay'

import
{
  useLayers,
  useViewport,
  useCanvasDimensions,
  useSelection,
  useActiveLayerId,
} from '../../hooks/useSpriteEditorStore.hook'

export const CanvasArea = () =>
{
  const containerRef = useRef<HTMLDivElement>( null )
  const [ size, setSize ] = useState( { width: 0, height: 0 } )

  const layers = useLayers()
  const viewport = useViewport()
  const canvasDimensions = useCanvasDimensions()
  const selection = useSelection()
  const activeLayerId = useActiveLayerId()

  const { handlePointerDown, handlePointerMove, handlePointerUp, handlePointerLeave } =
    useCanvasInteraction()
  const { handleWheel } = useCanvasZoom()

  useKeyboardShortcuts()

  useEffect( () =>
  {
    if ( !containerRef.current ) return
    const observer = new ResizeObserver( ( entries ) =>
    {
      const entry = entries[ 0 ]
      if ( entry )
      {
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
    <div ref={ containerRef } className="h-full w-full overflow-hidden bg-transparent">
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
          style={ { touchAction: 'none' } }
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
          />

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

