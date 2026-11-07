import { BUILD_SCREEN_COPY } from '@/constants/build-screen'

/** Display name shared by the Biblioteca rows and the asset catalog. */
export const toAssetName = (name: string): string => name.trim() || BUILD_SCREEN_COPY.LIBRARY_UNNAMED
