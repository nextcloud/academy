'use client'

import { useEffect, useState, useCallback } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import rehypeRaw from 'rehype-raw'
import type { Section, Module } from '@/lib/types'
import TopBar from './TopBar'
import { recordSectionChange, markModuleComplete, getModuleProgress, migrateLegacySections } from '@/lib/progress'

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
  /**
   * Where the sidebar "back" link and the post-completion redirect go.
   *
   * Defaults to the module's own level listing, which is right for a track
   * module. Standalone modules have no level page to return to, so they pass
   * the catalogue instead.
   */
  backHref?: string
  backLabel?: string
}

export default function ModulePlayerClient({
  trackId, levelId, moduleIndex, trackTitle, levelTitle,
  moduleTitle, moduleData, sections, prevModule, nextModule,
  backHref, backLabel,
}: Props) {
  const listHref = backHref ?? `/${trackId}/${levelId}`
  const listLabel = backLabel ?? levelTitle
  const router = useRouter()
  const moduleId = moduleData.id
  const [currentSection, setCurrentSection] = useState(0)
  const [visitedSections, setVisitedSections] = useState<Set<string>>(new Set())
  const [isComplete, setIsComplete] = useState(false)

  useEffect(() => {
    // Translate any v1 position-based progress into stable section ids first;
    // this component is the only place that knows the module's sections.
    migrateLegacySections(trackId, levelId, moduleId, moduleIndex, sections)

    const prog = getModuleProgress(trackId, levelId, moduleId, moduleIndex)
    setVisitedSections(new Set(prog.completedSections))
    setIsComplete(prog.completed)

    // Resume where the reader left off. An unknown id means the section was
    // renamed or removed since their last visit, so start from the beginning
    // rather than guessing at a position.
    const resumeAt = prog.lastSection
      ? sections.findIndex(s => s.id === prog.lastSection)
      : -1
    setCurrentSection(resumeAt >= 0 ? resumeAt : 0)
  }, [trackId, levelId, moduleId, moduleIndex, sections])

  const goToSection = useCallback((index: number) => {
    const leaving = sections[currentSection]
    const entering = sections[index]
    if (leaving && entering) {
      // The section being left counts as read; the one being entered becomes
      // the resume point.
      recordSectionChange(trackId, levelId, moduleId, leaving.id, entering.id, moduleIndex)
      setVisitedSections(prev => new Set([...prev, leaving.id]))
    }
    setCurrentSection(index)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [trackId, levelId, moduleId, moduleIndex, currentSection, sections])

  // Where "onward" goes once the module is finished: the next module, or back
  // to the module list if this was the last one. Shared by completion and by
  // the top and bottom controls, so they can never disagree.
  const onwardHref = nextModule
    ? `/${trackId}/${levelId}/${nextModule.index}`
    : listHref

  const handleComplete = () => {
    const allIds = sections.map(s => s.id)
    markModuleComplete(trackId, levelId, moduleId, allIds, moduleIndex)
    setIsComplete(true)
    setVisitedSections(new Set(allIds))

    // Go straight on rather than rendering a success panel that costs a second
    // click and shifts the button out from under the cursor. Within a track,
    // momentum beats a static acknowledgement. The panel still shows when a
    // reader revisits a finished module.
    // Standalone modules (no next module) land on the module list instead;
    // that's where a proper completion screen belongs later — academy #22.
    router.push(onwardHref)
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
            <Link href={listHref} className="text-xs text-gray-400 hover:text-gray-200 flex items-center gap-1 mb-3">
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              {listLabel}
            </Link>
            <div className="text-xs text-gray-400 mb-1">{trackTitle}</div>
            <div className="text-sm font-semibold leading-snug">
              {moduleIndex > 0 && (
                <span className="text-gray-400">M{moduleIndex}.{' '}</span>
              )}
              {moduleData.title}
            </div>
            {moduleData.estimated_minutes && (
              <div className="text-xs text-gray-500 mt-1">{moduleData.estimated_minutes} min</div>
            )}
          </div>
          <nav className="p-2">
            <div className="text-xs uppercase tracking-wider text-gray-500 px-2 py-2">Sections</div>
            {sections.map((sec, i) => {
              const visited = visitedSections.has(sec.id)
              const active = i === currentSection
              return (
                <button
                  key={sec.id}
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
              {/*
                Section controls are duplicated up here so readers don't have to
                scroll a long module to move on. Deliberately styled as quiet
                chrome rather than a second pair of CTAs, so a short module
                doesn't look like it has two competing button rows.
              */}
              <div className="flex items-center justify-between gap-4 mb-1">
                <div className="text-xs text-gray-500">
                  Section {currentSection + 1} of {sections.length}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <button
                    onClick={() => goToSection(currentSection - 1)}
                    disabled={currentSection === 0}
                    aria-label="Previous section"
                    className="flex items-center gap-1 px-2 py-1 text-xs text-gray-500 rounded hover:bg-gray-100 hover:text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed disabled:hover:bg-transparent transition-colors"
                  >
                    <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  {isLastSection ? (
                    isComplete ? (
                      <Link
                        href={onwardHref}
                        aria-label={nextModule ? 'Next module' : 'Back to all modules'}
                        className="flex items-center gap-1 px-2 py-1 text-xs text-green-700 rounded hover:bg-green-50 transition-colors font-medium"
                      >
                        {nextModule ? 'Next module' : 'All modules'}
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                        </svg>
                      </Link>
                    ) : (
                      <span className="px-2 py-1 text-xs text-gray-400" aria-hidden="true">Last section</span>
                    )
                  ) : (
                    <button
                      onClick={() => goToSection(currentSection + 1)}
                      aria-label="Next section"
                      className="flex items-center gap-1 px-2 py-1 text-xs text-blue-600 rounded hover:bg-blue-50 transition-colors font-medium"
                    >
                      Next
                      <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  )}
                </div>
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
              {/*
                rehypeRaw renders inline HTML in the markdown, which the course
                content needs for hand-written SVG diagrams (see php/beginner/3).
                Safe here because content/ is first-party markdown from this
                repo, never user input — audited: no <script> outside code
                fences. Reconsider if content ever becomes reader-supplied.
              */}
              <ReactMarkdown remarkPlugins={[remarkGfm]} rehypePlugins={[rehypeRaw]}>
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

              <div className="flex items-center gap-3">
                {/*
                  Explicit route back to the catalogue. The header title already
                  links home, but a logo is a convention rather than a label —
                  beta testers reported no obvious way back to the overview.
                */}
                <Link
                  href="/"
                  className="text-sm text-gray-500 hover:text-blue-600 hover:underline px-2 py-2 transition-colors"
                >
                  Course overview
                </Link>

                {isLastSection && isComplete ? (
                  // Already completed: this used to be a disabled button, which
                  // dead-ended anyone revisiting a finished module to look
                  // something up. Move them onward instead.
                  <Link
                    href={onwardHref}
                    className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    {nextModule ? `Continue to module ${nextModule.index}` : 'Back to all modules'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ) : isLastSection ? (
                  // The label states the navigation, since completing now moves
                  // the reader on immediately rather than showing a success panel.
                  <button
                    onClick={handleComplete}
                    className="flex items-center gap-2 px-5 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                  >
                    {nextModule
                      ? `Complete and continue to module ${nextModule.index}`
                      : 'Complete and back to all modules'}
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                ) : (
                  <button
                    onClick={() => goToSection(currentSection + 1)}
                    className="flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                  >
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                )}
              </div>
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
