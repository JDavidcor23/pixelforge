'use client'

import React from 'react'
import { useColorArea } from './useColorArea.hook'

interface ColorAreaProps {
  readonly onChange: (hex: string) => void
}

export const ColorArea: React.FC<ColorAreaProps> = ({ onChange }) => {
  const { containerRef, handleMouseDown } = useColorArea({ onChange })

  return (
    <div className="relative mb-4 overflow-hidden rounded-lg border border-white/10 shadow-lg">
      <div
        ref={containerRef}
        onMouseDown={handleMouseDown}
        className="h-32 w-full cursor-crosshair touch-none select-none transition-shadow hover:shadow-[0_0_15px_rgba(0,245,255,0.1)]"
        style={{
          background: `
            linear-gradient(to bottom, #fff 0%, transparent 50%, #000 100%),
            linear-gradient(to right, #f00 0%, #ff0 16.66%, #0f0 33.33%, #0ff 50%, #00f 66.66%, #f0f 83.33%, #f00 100%)
          `,
          backgroundBlendMode: 'screen, normal'
        }}
      >
        {/* We can add a cursor here later if we want to show current selection precisely */}
      </div>
      
      {/* Checkerboard background for transparency preview (if needed) */}
      <div className="absolute inset-0 -z-10 bg-[url('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAQAAAAECAIAAAAmSBTwAAAAAXNSR0IArs4c6QAAAARnQU1BAACxjwv8YQUAAAAJcEhZcwAADsMAAA7DAcdvqGQAAAAWSURBVBhXY/j//z8DAyMAAxsIAABh/wD/O4YvOAAAAABJRU5ErkJggg==')] opacity-10" />
    </div>
  )
}
