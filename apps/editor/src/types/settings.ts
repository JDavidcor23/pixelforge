import type { API_KEY_PROVIDER } from '@/constants/settings'

export type ApiKeyProvider = (typeof API_KEY_PROVIDER)[keyof typeof API_KEY_PROVIDER]
