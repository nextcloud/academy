import Link from 'next/link'
import { newIssueUrl } from '@/lib/feedback'

/**
 * `feedbackContext` is passed by pages that know where the reader is, so the
 * "Report an error" link arrives at GitHub with the location prefilled.
 */
export default function TopBar({ feedbackContext }: { feedbackContext?: string } = {}) {
  return (
    <>
      {/* min-h rather than a fixed h-14: with the legal links added, one row no
          longer fits on a narrow phone, so the row is allowed to wrap and the
          bar grows instead of clipping the buttons off the right edge. */}
      <header className="bg-navy border-b border-white/10 min-h-14 sticky top-0 z-50">
        {/* Same max-width + horizontal padding as the hero, filter bar, main and
            footer, so every row of the page shares one content edge. */}
        <div className="max-w-[1200px] mx-auto px-6 md:px-8 min-h-14 flex flex-wrap items-center gap-x-3 gap-y-2 py-2 md:gap-x-8">
          {/* w-full below sm: the title keeps its own row on a phone and
              everything else wraps underneath it, rather than the title being
              abbreviated to fit alongside. The full name fits a 390px viewport. */}
          <Link href="/" className="flex w-full items-center gap-2.5 whitespace-nowrap font-semibold text-white/95 hover:text-white transition-colors sm:w-auto">
            {/* Official Nextcloud logo mark, white variant for the navy header.
                Path and colour come from the brand asset; do not recolour or
                redraw it. viewBox is the mark's own bounding box, so the wordmark
                is not included - the text next to it already says "Nextcloud". */}
            <svg className="h-6 w-auto shrink-0" viewBox="14.26 35.2 121.49 55.31" aria-hidden="true">
              <path d="M75.092,35.198c-12.592,0-23.265,8.537-26.573,20.103-2.875-6.135-9.105-10.433-16.281-10.433-9.869,0-17.981,8.112-17.981,17.981s8.112,17.985,17.981,17.985c7.176,0,13.406-4.301,16.281-10.437,3.308,11.567,13.981,20.107,26.573,20.107,12.499,0,23.118-8.411,26.51-19.848,2.928,5.997,9.081,10.177,16.155,10.177,9.869,0,17.985-8.116,17.985-17.985s-8.116-17.981-17.985-17.981c-7.074,0-13.227,4.178-16.155,10.174-3.393-11.436-14.011-19.844-26.51-19.844h0ZM75.092,45.753c9.506,0,17.099,7.59,17.099,17.096s-7.594,17.099-17.099,17.099-17.096-7.594-17.096-17.099,7.59-17.096,17.096-17.096ZM32.239,55.424c4.165,0,7.429,3.261,7.429,7.426s-3.265,7.429-7.429,7.429-7.426-3.265-7.426-7.429,3.261-7.426,7.426-7.426ZM117.757,55.424c4.165,0,7.429,3.261,7.429,7.426s-3.265,7.429-7.429,7.429-7.426-3.265-7.426-7.429,3.261-7.426,7.426-7.426Z" fill="#fff" />
            </svg>
            <span>Nextcloud Developer Course</span>
          </Link>
          <span className="text-xs font-semibold uppercase tracking-wide bg-white/10 text-white/80 border border-white/20 rounded px-1.5 py-0.5">
            Beta
          </span>
          {/* Imprint and privacy live in the header rather than the footer on
              purpose: TopBar renders on every page, and a German Impressum has
              to be reachable from anywhere on the site. The footer only exists
              on the homepage today, so it cannot carry them. Always rendered,
              never hidden behind a breakpoint - a legal link that disappears on
              a phone is not permanently available. Both point at nextcloud.com
              rather than restating the text here, so there is one canonical
              copy to keep current. */}
          <nav aria-label="Legal" className="flex items-center gap-4 text-xs text-white/60 sm:ml-auto">
            <a
              href="https://nextcloud.com/impressum/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/90 transition-colors"
            >
              Imprint
            </a>
            <a
              href="https://nextcloud.com/privacy/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-white/90 transition-colors"
            >
              Privacy
            </a>
          </nav>
          <div>
            <a
              href={newIssueUrl(feedbackContext)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 text-sm text-white/70 hover:text-white border border-white/20 hover:border-white/40 rounded-md px-3 py-1.5 transition-colors"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <circle cx="12" cy="12" r="10" />
                <line x1="12" y1="8" x2="12" y2="12" />
                <line x1="12" y1="16" x2="12.01" y2="16" />
              </svg>
              <span className="hidden sm:inline">Report an error</span>
              <span className="sm:hidden">Report</span>
            </a>
          </div>
        </div>
      </header>
      <div className="bg-amber-50 border-b border-amber-200 py-2 text-sm text-amber-900">
        <div className="max-w-[1200px] mx-auto px-6 md:px-8">
          <strong className="font-semibold">This course is in beta.</strong>{' '}
          Only the beginner tracks are written so far, and content may still change.
          Found a mistake or something unclear?{' '}
          <a
            href={newIssueUrl(feedbackContext)}
            target="_blank"
            rel="noopener noreferrer"
            className="underline font-medium hover:text-amber-950"
          >
            Open an issue on GitHub
          </a>
          {' '}- feedback is very welcome.
        </div>
      </div>
    </>
  )
}
