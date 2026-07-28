'use client'

import Link from 'next/link'
import { useEffect, useState } from 'react'
import TopBar from './TopBar'
import type { CourseManifest } from '@/lib/types'
import { getLevelProgress } from '@/lib/progress'

const TRACK_COLORS: Record<string, string> = {
  php: 'bg-purple-100 text-purple-800 border-purple-200',
  exapp: 'bg-green-100 text-green-800 border-green-200',
}

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced']

export default function CatalogClient({ manifest }: { manifest: CourseManifest }) {
  const [progress, setProgress] = useState<Record<string, number>>({})

  useEffect(() => {
    const p: Record<string, number> = {}
    for (const [trackId, track] of Object.entries(manifest.tracks)) {
      for (const [levelId, level] of Object.entries(track.levels)) {
        const key = `${trackId}/${levelId}`
        p[key] = getLevelProgress(trackId, levelId, level.modules.length)
      }
    }
    setProgress(p)
  }, [manifest])

  return (
    <div className="min-h-screen">
      <TopBar />
      <main className="max-w-5xl mx-auto px-6 py-12">
        <div className="mb-10">
          <h1 className="text-3xl font-bold text-gray-900 mb-3">{manifest.course.title}</h1>
          <p className="text-gray-600 text-lg">Two tracks, three levels. Pick your starting point below.</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {Object.entries(manifest.tracks).map(([trackId, track]) => (
            <div key={trackId} className="bg-white rounded-xl border border-gray-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-gray-100">
                <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded border mb-3 ${TRACK_COLORS[trackId] ?? 'bg-gray-100 text-gray-700 border-gray-200'}`}>
                  {trackId === 'php' ? 'PHP' : 'ExApp / Python'}
                </span>
                <h2 className="text-xl font-semibold text-gray-900 mb-1">{track.title}</h2>
                <p className="text-gray-600 text-sm">{track.tagline}</p>
              </div>
              <div className="divide-y divide-gray-100">
                {LEVEL_ORDER.filter(l => track.levels[l]).map(levelId => {
                  const level = track.levels[levelId]
                  const pct = progress[`${trackId}/${levelId}`] ?? 0
                  return (
                    <Link
                      key={levelId}
                      href={`/${trackId}/${levelId}`}
                      className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors group"
                    >
                      <div>
                        <div className="font-medium text-gray-900 group-hover:text-blue-600">{level.title}</div>
                        <div className="text-sm text-gray-500">{level.tagline}</div>
                        <div className="text-xs text-gray-400 mt-0.5">{level.modules.length} modules · {level.estimated_hours}h</div>
                      </div>
                      <div className="flex items-center gap-3 ml-4">
                        {pct > 0 && (
                          <div className="text-right">
                            <div className="text-xs text-gray-500 mb-1">{pct}%</div>
                            <div className="w-16 h-1.5 bg-gray-200 rounded-full">
                              <div className="h-1.5 bg-green-500 rounded-full" style={{ width: `${pct}%` }} />
                            </div>
                          </div>
                        )}
                        <svg className="w-4 h-4 text-gray-400 group-hover:text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </div>
                    </Link>
                  )
                })}
              </div>
            </div>
          ))}
        </div>
      </main>
    </div>
  )
}
