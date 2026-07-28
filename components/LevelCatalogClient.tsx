'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import TopBar from './TopBar'
import type { Track, Level } from '@/lib/types'
import { getProgress } from '@/lib/progress'

export default function LevelCatalogClient({
  track, level, trackId, levelId,
}: {
  track: Track
  level: Level
  trackId: string
  levelId: string
}) {
  const [progressStore, setProgressStore] = useState<Record<string, { completed: boolean; completedSections: number[] }>>({})

  useEffect(() => {
    setProgressStore(getProgress())
  }, [])

  const sorted = [...level.modules].sort((a, b) => a.index - b.index)

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-blue-600 hover:underline mb-6 inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All tracks
        </Link>
        <div className="mb-8">
          <p className="text-sm text-gray-500 mb-1">{track.title}</p>
          <h1 className="text-2xl font-bold text-gray-900 mb-1">{level.title}</h1>
          <p className="text-gray-600">{level.tagline}</p>
          <p className="text-sm text-gray-500 mt-1">{level.modules.length} modules · {level.estimated_hours}h estimated</p>
        </div>

        <div className="grid gap-3">
          {sorted.map((mod) => {
            const key = `${trackId}/${levelId}/${mod.index}`
            const prog = progressStore[key]
            const isComplete = prog?.completed ?? false
            const isStarted = (prog?.completedSections?.length ?? 0) > 0 && !isComplete

            return (
              <Link
                key={mod.id}
                href={`/${trackId}/${levelId}/${mod.index}`}
                className={`flex items-start gap-4 p-5 rounded-xl border transition-all group ${
                  isComplete
                    ? 'bg-green-50 border-green-200 hover:border-green-300'
                    : 'bg-white border-gray-200 hover:border-blue-300 hover:shadow-sm'
                }`}
              >
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-semibold flex-shrink-0 mt-0.5 ${
                  isComplete
                    ? 'bg-green-500 text-white'
                    : isStarted
                    ? 'bg-blue-100 text-blue-700 ring-2 ring-blue-300'
                    : 'bg-gray-100 text-gray-600'
                }`}>
                  {isComplete ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : mod.index}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-gray-900 group-hover:text-blue-700">{mod.title}</div>
                  <div className="text-sm text-gray-500 mt-0.5 line-clamp-2">{mod.description}</div>
                  <div className="text-xs text-gray-400 mt-1">{mod.estimated_minutes} min</div>
                </div>
                <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500 mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            )
          })}
        </div>
      </main>
    </div>
  )
}
