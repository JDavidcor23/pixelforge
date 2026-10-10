/** Settings dialog — provider ids, help links and feedback timing. */
export const API_KEY_PROVIDER = {
  RETRO_DIFFUSION: 'retro',
  ELEVENLABS: 'elevenlabs',
} as const

export const API_KEY_HELP_URL = {
  RETRO_DIFFUSION: 'https://www.retrodiffusion.ai/app/guide/api',
  ELEVENLABS: 'https://elevenlabs.io/docs/api-reference/authentication',
} as const

export const API_KEY_SAVED_FEEDBACK_MS = 2000
