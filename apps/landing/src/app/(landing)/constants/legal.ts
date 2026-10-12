import type { LegalSection } from '../types'
import { BRAND } from '@/constants/BRAND'

export const LEGAL_LAST_UPDATED = 'October 12, 2026'

export const PRIVACY_POLICY_SECTIONS: readonly LegalSection[] = [
  {
    heading: 'Who runs this',
    paragraphs: [
      `${BRAND.FULL_NAME} (${BRAND.SITE_URL.replace('https://www.', 'https://')}) is a browser-based pixel-art game editor built and run by an independent developer, ${BRAND.DEVELOPER_NAME}, based in Colombia. For any privacy question, write to ${BRAND.CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: 'Signing in with Google',
    paragraphs: [
      'You sign in through Google, handled by Supabase Auth. Google sends us your email address, name, and profile picture. We keep only your email address and Google\'s account identifier, which sign-in needs; your name and profile picture are discarded automatically the moment they arrive and are never stored. We do not request or receive access to your contacts, Drive, Gmail, or anything else in your Google account.',
    ],
  },
  {
    heading: 'What we store',
    paragraphs: [
      'Once you are signed in, we store the following in Supabase (database and private file storage, hosted in the US):',
    ],
    list: [
      'Your account: email address and sign-in identifier only.',
      'Your projects and sprite documents.',
      'Assets you generate: images, animations, and sounds.',
    ],
  },
  {
    heading: 'Who can see your data',
    paragraphs: [
      'Each account can only access its own projects, documents, and assets. This is enforced with row-level security at the database level — one user cannot read or modify another user’s data.',
    ],
  },
  {
    heading: 'What stays only on your device',
    paragraphs: [
      'Two things never reach our servers for storage:',
    ],
    list: [
      'Drafts: kept in your browser (IndexedDB) until you save them.',
      'Third-party API keys (Retro Diffusion, PixelLab, ElevenLabs, OpenAI): stored in your browser’s localStorage, never in our database.',
    ],
  },
  {
    heading: 'How generation requests work',
    paragraphs: [
      'When you generate an asset, your API key, your prompt, and any reference image you provide pass through our server only to forward that request to the AI provider you chose. We do not store your API keys, and we do not log your prompts or generated content on our side.',
    ],
  },
  {
    heading: 'Who else receives data',
    paragraphs: [
      'We share data with the following third parties, each under its own privacy policy:',
    ],
    list: [
      'Google — sign-in.',
      'Supabase — hosts the account, project, and asset data.',
      'Vercel — hosts the application.',
      'The AI provider you choose for a given generation (Retro Diffusion, PixelLab, OpenAI, or ElevenLabs) — only the prompt, reference image, and your own API key for that request.',
    ],
  },
  {
    heading: 'No ads, no selling data',
    paragraphs: [
      `${BRAND.FULL_NAME} does not run ads, does not sell your data, and does not use tracking cookies. We only use the cookies and local storage needed to keep you signed in and your session working.`,
    ],
  },
  {
    heading: 'Deleting your data',
    paragraphs: [
      'You can delete your account at any time from Account Settings inside the app, using "Delete my account." This permanently and immediately deletes your account, profile, projects, documents, assets, and all stored files.',
      `If you prefer, email ${BRAND.CONTACT_EMAIL} and we will do it for you within 30 days.`,
      'After deletion, we keep a minimal record — an anonymous account ID and the date of deletion — as proof the deletion happened. It contains no personal data.',
    ],
  },
  {
    heading: 'How long we keep data',
    paragraphs: [
      'We keep your data for as long as your account exists. See "Deleting your data" above for how to remove it.',
    ],
  },
  {
    heading: 'Children',
    paragraphs: [
      `${BRAND.FULL_NAME} is not directed to children under 13, and we do not knowingly collect data from them.`,
    ],
  },
  {
    heading: 'Google API Services User Data Policy',
    paragraphs: [
      `${BRAND.FULL_NAME}'s use and transfer of information received from Google APIs adheres to the Google API Services User Data Policy, including the Limited Use requirements.`,
    ],
  },
  {
    heading: 'Changes to this policy',
    paragraphs: [
      'If this policy changes, we will post the update on this page with a new "Last updated" date.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `Questions about this policy or your data: ${BRAND.CONTACT_EMAIL}.`,
    ],
  },
] as const

export const TERMS_OF_USE_SECTIONS: readonly LegalSection[] = [
  {
    heading: 'Who runs this',
    paragraphs: [
      `${BRAND.FULL_NAME} is built and run by an independent developer, ${BRAND.DEVELOPER_NAME}, based in Colombia. For any question about these terms, write to ${BRAND.CONTACT_EMAIL}.`,
    ],
  },
  {
    heading: 'Early-stage software',
    paragraphs: [
      `${BRAND.FULL_NAME} is in early development and is provided "as is," without warranties of any kind. Features may change, break, or be removed, and data loss is possible. Use it at your own risk, and keep your own backups or exports of anything you cannot afford to lose.`,
    ],
  },
  {
    heading: 'Your account',
    paragraphs: [
      'You sign in with your Google account. You are responsible for keeping access to that account secure.',
    ],
  },
  {
    heading: 'What you own',
    paragraphs: [
      'You own the projects, sprites, and other content you create, including anything generated with AI through the app, subject to the terms of the AI provider you used for that generation (Retro Diffusion, PixelLab, OpenAI, or ElevenLabs).',
    ],
  },
  {
    heading: 'Your API keys and provider costs',
    paragraphs: [
      'To generate assets, you supply your own API key for the provider you choose. You are responsible for that key and for any costs it incurs with that provider. We do not store your keys and do not control what the provider charges you.',
    ],
  },
  {
    heading: 'Acceptable use',
    paragraphs: [
      `You agree not to use ${BRAND.FULL_NAME} to create, upload, or distribute illegal content or content that infringes someone else's rights. We can suspend or terminate access for abuse of the service.`,
    ],
  },
  {
    heading: 'Limitation of liability',
    paragraphs: [
      `To the maximum extent allowed by law, ${BRAND.FULL_NAME} and its developer are not liable for any indirect, incidental, or consequential damages arising from your use of the service, including loss of data or generated content.`,
    ],
  },
  {
    heading: 'Governing law',
    paragraphs: [
      'These terms are governed by the laws of Colombia.',
    ],
  },
  {
    heading: 'Changes to these terms',
    paragraphs: [
      'If these terms change, we will post the update on this page with a new "Last updated" date.',
    ],
  },
  {
    heading: 'Contact',
    paragraphs: [
      `Questions about these terms: ${BRAND.CONTACT_EMAIL}.`,
    ],
  },
] as const
