import type { Metadata } from 'next'

import { Navbar } from '../components/Navbar/Navbar'
import { Footer } from '../components/Footer/Footer'
import { LegalDocument } from '../components/LegalDocument/LegalDocument'
import { LEGAL_LAST_UPDATED, PRIVACY_POLICY_SECTIONS } from '../constants/legal'
import { BRAND } from '@/constants/BRAND'

const PAGE_TITLE = `Privacy Policy - ${BRAND.FULL_NAME}`
const PAGE_DESCRIPTION = `How ${BRAND.FULL_NAME} collects, stores, and protects your data.`

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
}

export default function PrivacyPage()
{
  return (
    <>
      <Navbar />
      <main className="bg-[#0a0c10]">
        <LegalDocument
          title="Privacy Policy"
          lastUpdated={ LEGAL_LAST_UPDATED }
          sections={ PRIVACY_POLICY_SECTIONS }
        />
      </main>
      <Footer />
    </>
  )
}
