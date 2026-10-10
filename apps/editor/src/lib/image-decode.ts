import type { PixelBuffer } from '@/types'

/**
 * Decodes a base64 PNG at its NATIVE resolution into a PixelBuffer.
 *
 * No resampling happens here — callers that need a different size run their own
 * scaling afterwards, so nothing is silently resized behind their back. This is
 * the single decode entry point for every image that enters the editor:
 * generated sprites, animation sheets and user file imports alike.
 */
export async function base64ToNativePixels(base64: string): Promise<PixelBuffer> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.src = base64.startsWith('data:') ? base64 : `data:image/png;base64,${base64}`
    img.crossOrigin = 'anonymous'

    img.onload = () => {
      const canvas = document.createElement('canvas')
      canvas.width = img.naturalWidth
      canvas.height = img.naturalHeight
      const ctx = canvas.getContext('2d', { willReadFrequently: true })
      if (!ctx) {
        reject(new Error('Could not create 2D context'))
        return
      }
      ctx.drawImage(img, 0, 0)
      const { data } = ctx.getImageData(0, 0, canvas.width, canvas.height)
      resolve({ w: canvas.width, h: canvas.height, data: new Uint8ClampedArray(data) })
    }

    img.onerror = () => reject(new Error('Failed to load image from base64'))
  })
}
