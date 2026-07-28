'use client'

import Link from 'next/link'
import { useAuth } from '@/context/AuthContext'
import { useState } from 'react'

export default function TopBar() {
  const { user, signOut } = useAuth()
  const [menuOpen, setMenuOpen] = useState(false)

  return (
    <header className="bg-white border-b border-gray-200 h-14 flex items-center px-6 sticky top-0 z-50">
      <Link href="/" className="flex items-center gap-2 font-semibold text-gray-900 hover:text-blue-600 transition-colors">
        <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>
        </svg>
        Nextcloud Developer Course
      </Link>
      <div className="ml-auto flex items-center gap-3">
        {user ? (
          <div className="relative">
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="flex items-center gap-2 text-sm text-gray-700 hover:text-gray-900"
            >
              <span className="w-7 h-7 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-semibold">
                {user.name[0].toUpperCase()}
              </span>
              {user.name}
            </button>
            {menuOpen && (
              <div className="absolute right-0 top-9 bg-white border border-gray-200 rounded-lg shadow-lg py-1 w-40 z-50">
                <button
                  onClick={() => { signOut(); setMenuOpen(false) }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-50"
                >
                  Sign out
                </button>
              </div>
            )}
          </div>
        ) : (
          <>
            <Link href="/auth/login" className="text-sm text-gray-600 hover:text-gray-900">Sign in</Link>
            <Link href="/auth/register" className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-md hover:bg-blue-700 transition-colors">
              Register
            </Link>
          </>
        )}
      </div>
    </header>
  )
}
