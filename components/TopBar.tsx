import Link from 'next/link'

export default function TopBar() {
  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors">
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        </svg>
        Nextcloud Developer Course
      </Link>
    </header>
  )
}
