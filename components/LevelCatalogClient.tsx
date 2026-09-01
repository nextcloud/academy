'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import TopBar from './TopBar'
import type { Track, Level } from '@/lib/types'
import { getProgress, moduleKey } from '@/lib/progress'
import type { ModuleProgress } from '@/lib/types'

export default function LevelCatalogClient({
  track, level, trackId, levelId,
}: {
  track: Track
  level: Level
  trackId: string
  levelId: string
}) {
  const [progressStore, setProgressStore] = useState<Record<string, ModuleProgress>>({})

  useEffect(() => {
    setProgressStore(getProgress().modules)
  }, [])

  const sorted = [...level.modules].sort((a, b) => a.index - b.index)

  return (
    <div className="min-h-screen">
      <TopBar feedbackContext={`${track.title} / ${level.title}`} />
      <main className="max-w-4xl mx-auto px-6 py-10">
        <Link href="/" className="text-sm text-nc-blue hover:underline mb-6 inline-flex items-center gap-1">
          <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          All tracks
        </Link>
        <div className="mb-8 border-b-2 border-rule pb-4">
          <p className="mb-1 font-mono text-xs uppercase tracking-[0.08em] text-muted">{track.title}</p>
          <h1 className="mb-1 text-2xl font-bold text-ink">{level.title}</h1>
          <p className="text-muted">{level.tagline}</p>
          <p className="mt-1 font-mono text-xs text-muted">{level.modules.length} modules · ~{level.estimated_hours}h estimated</p>
        </div>

        <div className="grid gap-3">
          {sorted.map((mod) => {
            // Prefer the id-based key; fall back to the v1 position-based one
            // for readers whose progress has not been migrated yet.
            const prog = progressStore[moduleKey(trackId, levelId, mod.id)]
              ?? progressStore[`${trackId}/${levelId}/${mod.index}`]
            const isComplete = prog?.completed ?? false
            const startedSections = (prog?.completedSections?.length ?? 0) + (prog?.legacySections?.length ?? 0)
            const isStarted = startedSections > 0 && !isComplete

            return (
              <Link
                key={mod.id}
                href={`/${trackId}/${levelId}/${mod.index}`}
                className={`group relative flex items-start gap-4 overflow-hidden rounded-lg border p-5 transition-all ${
                  isComplete
                    ? 'border-[#c9e6d1] bg-nc-green-light hover:border-nc-green'
                    : 'border-rule bg-white hover:border-nc-blue hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)]'
                }`}
              >
                {/* Blue top rule on hover, matching the catalog cards. */}
                <span
                  aria-hidden="true"
                  className={`absolute inset-x-0 top-0 h-[3px] opacity-0 transition-opacity group-hover:opacity-100 ${
                    isComplete ? 'bg-nc-green' : 'bg-nc-blue'
                  }`}
                />
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-mono text-sm font-semibold flex-shrink-0 mt-0.5 ${
                  isComplete
                    ? 'bg-nc-green text-white'
                    : isStarted
                    ? 'bg-nc-blue-light text-nc-blue-dark ring-2 ring-nc-blue/40'
                    : 'bg-nc-blue-light text-muted'
                }`}>
                  {isComplete ? (
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : mod.index}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="font-semibold text-ink group-hover:text-nc-blue-dark">{mod.title}</div>
                  <div className="text-sm text-muted mt-0.5 line-clamp-2">{mod.description}</div>
                  <div className="mt-1 font-mono text-[0.72rem] text-muted">⏱ {mod.estimated_minutes} min</div>
                </div>
                <svg className="w-4 h-4 text-muted group-hover:text-nc-blue mt-1 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
