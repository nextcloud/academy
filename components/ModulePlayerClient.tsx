'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import type { Section, Module } from '@/lib/types'
import TopBar from './TopBar'
import { markSectionVisited, markModuleComplete, getModuleProgress } from '@/lib/progress'

interface Props {
  trackId: string
  levelId: string
  moduleIndex: number
  trackTitle: string
  levelTitle: string
  moduleTitle: string
  moduleData: Module
  sections: Section[]
  prevModule: Module | null
  nextModule: Module | null
}

export default function ModulePlayerClient({
  trackId, levelId, moduleIndex, trackTitle, levelTitle,
  moduleTitle, moduleData, sections, prevModule, nextModule,
}: Props) {
  const [currentSection, setCurrentSection] = useState(0)
  const [visitedSections, setVisitedSections] = useState<Set<number>>(new Set())
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    const prog = getModuleProgress(trackId, levelId, moduleIndex)
    setVisitedSections(new Set(prog.completedSections))
    setIsComplete(prog.completed)
    const start = Math.min(prog.lastSection, sections.length - 1)
    setCurrentSection(start)
  }, [trackId, levelId, moduleIndex, sections.length])

  const goToSection = useCallback((index: number) => {
    markSectionVisited(trackId, levelId, moduleIndex, currentSection)
    setVisitedSections(prev => new Set([...prev, currentSection]))
    setCurrentSection(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [trackId, levelId, moduleIndex, currentSection])

  const handleComplete = () => {
    markModuleComplete(trackId, levelId, moduleIndex, sections.length)
    setIsComplete(true)
    setVisitedSections(new Set(sections.map((_, i) => i)))
  }

  const isLastSection = currentSection === sections.length - 1
  const section = sections[currentSection]

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar feedbackContext={`${trackTitle} / ${levelTitle} / ${moduleTitle}`} />
      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar */}
        <aside className="w-64 bg-gray-900 text-white flex-shrink-0 overflow-y-auto hidden md:block">
          <div className="p-4 border-b border-gray-700">
            <Link href={`/${trackId}/${levelId}`} className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {levelTitle}
            </Link>
            <div className="text-xs text-gray-400 mb-1">{trackTitle}</div>
            <div className="text-sm font-semibold leading-snug">
              <span className="text-gray-400">M{moduleIndex}.</span>{' '}
              {moduleData.title}
            </div>
            {moduleData.estimated_minutes && (
              <div className="text-xs text-gray-500 mt-1">{moduleData.estimated_minutes} min</div>
            )}
          </div>
          <nav className="p-2">
            <div className="text-xs uppercase tracking-wider text-gray-500 px-2 py-2">Sections</div>
            {sections.map((sec, i) => {
              const visited = visitedSections.has(i)
              const active = i === currentSection
              return (
                <button
                  key={i}
                  onClick={() => goToSection(i)}
                  className={`w-full text-left px-3 py-2 rounded-lg text-sm flex items-start gap-2 transition-colors mb-0.5 ${
                    active
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800 hover:text-white'
                  }`}
                >
                  <span className={`w-4 h-4 rounded-full border flex-shrink-0 mt-0.5 flex items-center justify-center ${
                    visited
                      ? 'bg-green-500 border-green-500'
                      : active
                      ? 'border-white'
                      : 'border-gray-600'
                  }`}>
                    {visited && (
                      <svg className="w-2.5 h-2.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="leading-snug">{sec.title}</span>
                </button>
              )
            })}
          </nav>
        </aside>

        {/* Main content */}
        <main className="flex-1 overflow-y-auto">
          <div className="max-w-3xl mx-auto px-6 py-8">
            <div className="mb-6">
              <div className="text-xs text-gray-500 mb-1">
                Section {currentSection + 1} of {sections.length}
              </div>
              <h1 className="text-2xl font-bold text-gray-900">{section?.title}</h1>
              <div className="mt-3 h-1 bg-gray-200 rounded-full">
                <div
                  className="h-1 bg-blue-500 rounded-full transition-all"
                  style={{ width: `${((currentSection + 1) / sections.length) * 100}%` }}
                />
              </div>
            </div>

            <div className="prose max-w-none">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>
                {section?.content ?? ''}
              </ReactMarkdown>
            </div>

            {isComplete && (
              <div className="mt-8 bg-green-50 border border-green-200 rounded-xl p-5 flex items-center gap-3">
                <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center flex-shrink-0">
                  <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <div>
                  <div className="font-semibold text-green-900">Module complete!</div>
                  {nextModule && (
                    <div className="text-sm text-green-700 mt-0.5">
                      Next up: <Link href={`/${trackId}/${levelId}/${nextModule.index}`} className="underline font-medium">{nextModule.title}</Link>
                    </div>
                  )}
                </div>
              </div>
            )}

            <div className="mt-10 pt-6 border-t border-gray-200 flex items-center justify-between gap-4">
              <button
                onClick={() => goToSection(currentSection - 1)}
                disabled={currentSection === 0}
                className="flex items-center gap-2 px-4 py-2 text-sm border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>

              {isLastSection ? (
                <button
                  onClick={handleComplete}
                  disabled={isComplete}
                  className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors font-medium"
                >
                  {isComplete ? 'Completed ✓' : 'Mark module complete'}
                </button>
              ) : (
                <button
                  onClick={() => goToSection(currentSection + 1)}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                >
                  Next
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            <div className="mt-6 flex gap-3">
              {prevModule && (
                <Link
                  href={`/${trackId}/${levelId}/${prevModule.index}`}
                  className="flex-1 text-center text-sm text-gray-500 hover:text-blue-600 hover:underline py-2"
                >
                  ← {prevModule.title}
                </Link>
              )}
              {nextModule && (
                <Link
                  href={`/${trackId}/${levelId}/${nextModule.index}`}
                  className="flex-1 text-center text-sm text-gray-500 hover:text-blue-600 hover:underline py-2"
                >
                  {nextModule.title} →
                </Link>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}
