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
            <svg className="w-7 h-7 shrink-0" viewBox="0 0 256 256" fill="none" aria-hidden="true">
              <circle cx="128" cy="128" r="128" fill="#0082C9" />
              <path d="M128 64c-24.3 0-44.8 15.7-52.5 37.5C70.1 99.2 64.2 98 58 98c-24.3 0-44 19.7-44 44s19.7 44 44 44c3.3 0 6.5-.4 9.6-1 9.1 17.5 27.4 29.5 48.6 29.5 17.3 0 32.8-7.9 43.2-20.4C169 197 178.3 200 188 200c24.3 0 44-19.7 44-44s-19.7-44-44-44c-1.1 0-2.2 0-3.3.1C176.8 91.9 154.2 64 128 64z" fill="white" />
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
