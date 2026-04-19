import Link from 'next/link'

import { LANDING_FOOTER, LANDING_FOOTER_LINKS } from '../../constants'
import { ROUTES } from '@/constants/ROUTES'

export const Footer = () =>
{
  return (
    <footer className="border-t border-white/5 bg-[#0a0c10] py-12">
      <div className="mx-auto max-w-7xl px-6">
        <div className="flex flex-col items-center justify-between gap-6 sm:flex-row">
          <Link href={ ROUTES.HOME } className="text-lg font-bold tracking-widest text-white">
            { LANDING_FOOTER.LOGO }
          </Link>

          <div className="flex items-center gap-6">
            { LANDING_FOOTER_LINKS.map( ( link ) =>
              link.isExternal ? (
                <a
                  key={ link.label }
                  href={ link.href }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  { link.label }
                </a>
              ) : (
                <Link
                  key={ link.label }
                  href={ link.href }
                  className="text-sm text-zinc-400 transition-colors hover:text-white"
                >
                  { link.label }
                </Link>
              )
            ) }
          </div>
        </div>

        <div className="mt-8 border-t border-white/5 pt-8 text-center">
          <p className="text-sm text-zinc-500">
            { LANDING_FOOTER.COPYRIGHT }
          </p>
        </div>
      </div>
    </footer>
  )
}
