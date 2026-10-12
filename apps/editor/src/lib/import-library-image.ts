import type { ImportedLibraryImage } from '@/types'

const readFileAsDataUrl = (file: File): Promise<string> =>
  new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result as string)
    reader.onerror = () => reject(new Error('Could not read the file.'))
    reader.readAsDataURL(file)
  })

const readImageDimensions = (dataUrl: string): Promise<{ width: number; height: number }> =>
  new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve({ width: img.naturalWidth, height: img.naturalHeight })
    img.onerror = () => reject(new Error('Could not read the image dimensions.'))
    img.src = dataUrl
  })

/** Strips the extension from a file name — used as the library entry's title. */
const stripExtension = (fileName: string): string => fileName.replace(/\.[^./]+$/, '')

/**
 * Reads a PNG picked from disk into the shape `useAssetsStore.addGeneration`
 * expects — the same entry point an AI result goes through, minus the Retro
 * Diffusion request itself.
 */
export const readLibraryImageFile = async (file: File): Promise<ImportedLibraryImage> => {
  const dataUrl = await readFileAsDataUrl(file)
  const { width, height } = await readImageDimensions(dataUrl)
  return { name: stripExtension(file.name), dataUrl, width, height }
}
