import type { RgbaColor } from '@/app/editor/types'

/**
 * THE TRANSFORMER: Converts a base64 encoded image to a 2D array of RgbaColor pixels.
 * This is the bridge between AI-generated images and our editable pixel grid.
 */
export async function base64ToPixels(
  base64Str: string, 
  targetWidth: number, 
  targetHeight: number
): Promise<RgbaColor[][]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.crossOrigin = 'anonymous'
    
    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = targetWidth
      canvas.height = targetHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      
      if (!ctx) {
        reject(new Error('Transformer Error: Failed to get 2d context'))
        return
      }

      // NO-SMOOTHING is critical for pixel art fidelity
      ctx.imageSmoothingEnabled = false
      
      // Draw the AI image onto our target-sized grid
      ctx.drawImage(img, 0, 0, targetWidth, targetHeight)
      
      const imageData = ctx.getImageData(0, 0, targetWidth, targetHeight)
      const { data } = imageData
      
      const pixels: RgbaColor[][] = []
      for (let y = 0; y < targetHeight; y++) {
        const row: RgbaColor[] = []
        for (let x = 0; x < targetWidth; x++) {
          const idx = (y * targetWidth + x) * 4
          
          // Sample RGBA values
          row.push({
            r: data[idx],
            g: data[idx + 1],
            b: data[idx + 2],
            a: data[idx + 3],
          })
        }
        pixels.push(row)
      }
      
      resolve(pixels)
    }

    img.onerror = () => reject(new Error('Transformer Error: Could not load base64 source'))
    
    // Sanitize and ensure proper prefix
    const sanitized = base64Str.replace(/\s/g, '')
    img.src = sanitized.startsWith('data:') ? sanitized : `data:image/png;base64,${sanitized}`
  })
}

/**
 * Calls our backend API proxy to generate an image from PixelLab.
 */
export async function generateSpriteWithPixelLab(prompt: string, width: number, height: number): Promise<string> {
  const response = await fetch('/api/ai/pixellab', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ prompt, width, height }),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || error.message || 'Failed to generate sprite with PixelLab')
  }

  const data = await response.json()
  return data.base64 // Should be the base64 data URI
}
