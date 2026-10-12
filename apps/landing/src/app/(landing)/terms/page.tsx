import type { Metadata } from 'next'

import { Navbar } from '../components/Navbar/Navbar'
import { Footer } from '../components/Footer/Footer'
import { LegalDocument } from '../components/LegalDocument/LegalDocument'
import { LEGAL_LAST_UPDATED, TERMS_OF_USE_SECTIONS } from '../constants/legal'
import { BRAND } from '@/constants/BRAND'

const PAGE_TITLE = `Terms of Use - ${BRAND.FULL_NAME}`
const PAGE_DESCRIPTION = `The terms for using ${BRAND.FULL_NAME}.`

export const metadata: Metadata = {
  title: PAGE_TITLE,
  description: PAGE_DESCRIPTION,
  openGraph: {
    title: PAGE_TITLE,
    description: PAGE_DESCRIPTION,
  },
}

export default function TermsPage()
{
  return (
    <>
      <Navbar />
      <main className="bg-[#0a0c10]">
        <LegalDocument
          title="Terms of Use"
          lastUpdated={ LEGAL_LAST_UPDATED }
          sections={ TERMS_OF_USE_SECTIONS }
        />
      </main>
      <Footer />
    </>
  )
}
