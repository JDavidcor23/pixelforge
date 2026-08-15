export interface QuantizeOptions {
  readonly colors: number
  readonly weightBySaturation: boolean
  readonly iterations: number
  readonly alphaThreshold: number // 0..255; below this a pixel stays transparent
}

export interface CodexGenerationResult {
  readonly base64: string // data URI PNG
  readonly width: number // native PNG width
  readonly height: number // native PNG height
  readonly sourcePath: string
}

export interface CodexGenerateRequestBody {
  readonly prompt: string
  readonly referenceBase64?: string
  readonly prependBase?: boolean
}

export interface AIAnimation {
  readonly pipelineVersion: number
  readonly id: string
  readonly label: string
  readonly frames: readonly string[]
  readonly frameDurationMs: number
  readonly timestamp: number
}
