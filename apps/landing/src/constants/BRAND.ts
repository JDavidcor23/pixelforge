/**
 * Canonical brand name, split into the fixed part and the accent-colored
 * suffix. Rendered together by `Wordmark` wherever the logo appears visually
 * (nav, footer, hero chrome); used as plain concatenated text in metadata,
 * alt text and other contexts where color cannot be applied.
 */
export const BRAND = {
  NAME: 'PixelForge',
  SUFFIX: 'IA',
  FULL_NAME: 'PixelForge IA',
  SITE_URL: 'https://www.pixelforgeia.com',
  DEVELOPER_NAME: 'Jorge David Díaz',
  CONTACT_EMAIL: 'jorgedavid23diaz@gmail.com',
} as const
