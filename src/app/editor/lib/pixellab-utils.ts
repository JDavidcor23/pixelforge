/**
 * Client-side utility for interacting with the PixelLab animation API proxy.
 */

/**
 * Sends a request to the backend proxy to generate an animation using PixelLab's animate-with-text.
 * @param params The animation parameters (description, action, direction, etc.)
 */
export async function generateAnimationWithPixelLab(
  params: any
): Promise<{ images: Array<{ type: string; base64: string }>; usage: { type: string; credits: number } }> {
  const response = await fetch('/api/ai/pixellab/animate-with-text', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(params),
  })

  if (!response.ok) {
    const error = await response.json()
    throw new Error(error.error || error.message || 'Failed to generate animation with PixelLab')
  }

  return response.json()
}

/**
 * Converts an AI-generated Base64 PNG image into a PixelBuffer.
 * Uses a hidden canvas to decode the image and read pixel data.
 */
export async function base64ToPixels(
  base64: string,
  width: number,
  height: number
): Promise<any[][]> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    // Ensure base64 has correct prefix
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d', { willReadFrequently: true })

      if (!ctx) {
        reject(new Error('Could not create 2D context'))
        return
      }

      // Draw image at target resolution
      ctx.imageSmoothingEnabled = false
      ctx.drawImage(img, 0, 0, width, height)

      const imageData = ctx.getImageData(0, 0, width, height)
      const data = imageData.data
      const pixels: any[][] = []

      for (let y = 0; y < height; y++) {
        const row: any[] = []
        for (let x = 0; x < width; x++) {
          const i = (y * width + x) * 4
          row.push({
            r: data[i],
            g: data[i + 1],
            b: data[i + 2],
            a: data[i + 3],
          })
        }
        pixels.push(row)
      }

      resolve(pixels)
    }

    img.onerror = () => reject(new Error('Failed to load image from base64'))
  })
}
