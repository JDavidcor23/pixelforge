export interface QuantizeOptions {
  readonly colors: number
  readonly weightBySaturation: boolean
  readonly iterations: number
  readonly alphaThreshold: number // 0..1; below this a pixel stays transparent
}

export interface CodexGenerationResult {
  readonly base64: string // data URI PNG
  readonly width: number // native PNG width
  readonly height: number // native PNG height
  readonly sourcePath: string
}
