/**
 * The library sound currently being dragged. Browsers hide `dataTransfer`
 * payloads during `dragover` (only the types are readable), so lanes read the
 * id from here to draw a correctly sized ghost before the drop happens.
 */
let draggingAssetId: string | null = null

export const soundDragSession = {
  start(assetId: string): void {
    draggingAssetId = assetId
  },
  current(): string | null {
    return draggingAssetId
  },
  end(): void {
    draggingAssetId = null
  },
}
