import Link from 'next/link'
import { newIssueUrl } from '@/lib/feedback'

/**
 * `feedbackContext` is passed by pages that know where the reader is, so the
 * "Report an error" link arrives at GitHub with the location prefilled.
 */
export default function TopBar({ feedbackContext }: { feedbackContext?: string } = {}) {
  return (
    <>
      <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 sticky top-0 z-50">
        <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors">
          <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
          </svg>
          Nextcloud Developer Course
        </Link>
        <span className="ml-2 text-xs font-semibold uppercase tracking-wide bg-amber-100 text-amber-800 border border-amber-200 rounded px-1.5 py-0.5">
          Beta
        </span>
        <div className="ml-auto">
          <a
            href={newIssueUrl(feedbackContext)}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 text-sm text-gray-600 hover:text-gray-900 border border-gray-300 hover:border-gray-400 rounded-md px-3 py-1.5 transition-colors"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <circle cx="12" cy="12" r="10" />
              <line x1="12" y1="8" x2="12" y2="12" />
              <line x1="12" y1="16" x2="12.01" y2="16" />
            </svg>
            Report an error
          </a>
        </div>
      </header>
      <div className="bg-amber-50 border-b border-amber-200 px-6 py-2 text-sm text-amber-900">
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
        {' '}— feedback is very welcome.
      </div>
    </>
  )
}
