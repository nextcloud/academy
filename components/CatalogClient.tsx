'use client'

import Link from 'next/link'
import { useEffect, useMemo, useState } from 'react'
import TopBar from './TopBar'
import type { CourseManifest } from '@/lib/types'
import { REPO_URL } from '@/lib/feedback'
import { getLevelProgress, getModuleProgress } from '@/lib/progress'

/**
 * Per-track chrome: glyph, short label and card tint.
 *
 * Presentation only — every string a reader actually reads (titles, taglines,
 * durations, module counts) comes from the manifest. Unknown tracks fall back to
 * a neutral style, so adding a track to the manifest cannot break this page.
 */
const TRACK_STYLE: Record<string, { label: string; glyph: string; badge: string; icon: string }> = {
  php: {
    label: 'PHP',
    glyph: '🐘',
    badge: 'bg-navy text-[#7ab8e8]',
    icon: 'bg-nc-blue-light',
  },
  exapp: {
    label: 'ExApp Python',
    glyph: '🐍',
    badge: 'bg-nc-green-light text-nc-green-dark',
    icon: 'bg-nc-green-light',
  },
  // Not a track, but it renders in the same card and section furniture, so it
  // needs the same style shape rather than falling through to the neutral one.
  standalone: {
    label: 'Standalone',
    glyph: '★',
    badge: 'bg-nc-blue-light text-nc-blue-dark',
    icon: 'bg-nc-blue-light',
  },
}

const FALLBACK_TRACK_STYLE = {
  label: 'Track',
  glyph: '◆',
  badge: 'bg-rule text-ink',
  icon: 'bg-rule',
}

const LEVEL_ORDER = ['beginner', 'intermediate', 'advanced']

const LEVEL_BADGE: Record<string, string> = {
  beginner: 'bg-[#dcfce7] text-[#166534]',
  intermediate: 'bg-[#fef9c3] text-[#854d0e]',
  advanced: 'bg-[#fee2e2] text-[#991b1b]',
}

const trackStyle = (trackId: string) => TRACK_STYLE[trackId] ?? FALLBACK_TRACK_STYLE

const CHIP_BASE =
  'shrink-0 whitespace-nowrap rounded-full border px-3.5 py-1 text-xs font-medium transition-colors cursor-pointer'

/**
 * Time buckets for the duration filter, matching the reference design.
 * `max: null` means "no upper bound".
 */
const TIME_BUCKETS: { id: string; label: string; min: number; max: number | null }[] = [
  { id: 'short', label: '≤30 min', min: 0, max: 30 },
  { id: 'medium', label: '31–60 min', min: 31, max: 60 },
  { id: 'long', label: '>60 min', min: 61, max: null },
]

/**
 * One module, flattened out of the manifest with its track and level alongside.
 *
 * Filtering, counting and the "is this readable yet" test all work on this one
 * list, so a module never appears in a section its own data disagrees with.
 */
interface CatalogModule {
  key: string
  trackId: string
  levelId: string
  index: number
  title: string
  description: string
  minutes: number
  /** Has content on disk. False means planned, and the card is inert.  */
  available: boolean
  /**
   * Where the card links to. Defaults to the track module path built from
   * trackId/levelId/index; standalone modules pass their own, since they have
   * no index to build one from.
   */
  href?: string
  /**
   * The small line above the title. Defaults to "M<index> · <track label>",
   * which is meaningless for a module that belongs to no track.
   */
  eyebrow?: string
}

/** A track/level pair, as one section of the page. */
interface CatalogSection {
  key: string
  trackId: string
  levelId: string
  title: string
  estimatedHours: string
  modules: CatalogModule[]
  /**
   * First readable module, ignoring the filters. The header call to action
   * falls back to this before progress has been read from localStorage, so
   * server-rendered markup still points somewhere sensible.
   */
  firstWrittenIndex: number | null
}

/**
 * What a reader has done with a module, once progress has been read.
 *
 * Absent means untouched. Every state carries a visible word on the card as
 * well as a colour, so the cue does not depend on colour perception.
 */
type ModuleState = 'done' | 'started'

/** State of a level's header call to action, once progress is known. */
interface SectionCta {
  href: string
  label: string
  /** Whole level finished - the button goes green and stops saying "continue". */
  done: boolean
}

export default function CatalogClient({
  manifest,
  writtenModules,
  writtenStandalone,
}: {
  manifest: CourseManifest
  writtenModules: Record<string, number[]>
  writtenStandalone: string[]
}) {
  const [progress, setProgress] = useState<Record<string, number>>({})
  const [ctas, setCtas] = useState<Record<string, SectionCta>>({})
  const [moduleStates, setModuleStates] = useState<Record<string, ModuleState>>({})
  const [trackFilter, setTrackFilter] = useState('all')
  const [levelFilter, setLevelFilter] = useState('all')
  const [timeFilter, setTimeFilter] = useState('all')

  useEffect(() => {
    const p: Record<string, number> = {}
    const c: Record<string, SectionCta> = {}
    const m: Record<string, ModuleState> = {}

    for (const [trackId, track] of Object.entries(manifest.tracks)) {
      for (const [levelId, level] of Object.entries(track.levels)) {
        const key = `${trackId}/${levelId}`
        p[key] = getLevelProgress(trackId, levelId, level.modules.map(m => ({ id: m.id, index: m.index })))

        // Only readable modules can be a destination; a planned one would 404.
        const written = writtenModules[key] ?? []
        const readable = level.modules.filter(m => written.includes(m.index))
        if (readable.length === 0) continue

        const states = readable.map(m => ({
          index: m.index,
          progress: getModuleProgress(trackId, levelId, m.id, m.index),
        }))
        const touched = (s: (typeof states)[number]) =>
          s.progress.completed || s.progress.lastSection !== null || s.progress.completedSections.length > 0

        for (const s of states) {
          if (s.progress.completed) m[`${key}/${s.index}`] = 'done'
          else if (touched(s)) m[`${key}/${s.index}`] = 'started'
        }

        if (states.every(s => s.progress.completed)) {
          // Finished: the level page is the useful destination now, since the
          // reader is revisiting rather than working through.
          c[key] = { href: `/${trackId}/${levelId}`, label: 'Completed', done: true }
          continue
        }

        /*
         * "Where I left off": the furthest module that has been opened but not
         * finished. Falling back to the first unfinished module covers both the
         * untouched level and the reader who completed 1-3 and never opened 4.
         */
        const inFlight = states.filter(s => !s.progress.completed && touched(s))
        const target = inFlight.at(-1) ?? states.find(s => !s.progress.completed)
        if (!target) continue

        c[key] = {
          href: `/${trackId}/${levelId}/${target.index}`,
          label: states.some(touched) ? 'Continue →' : 'Start track →',
          done: false,
        }
      }
    }

    /*
     * Standalone modules get the same Done / In progress badge as track
     * modules. They are keyed `standalone/<id>` to match the CatalogModule
     * keys built below, and read from the progress store under the same
     * `standalone/<level>/<id>` key the standalone route writes.
     */
    const availableStandalone = new Set(writtenStandalone)
    for (const category of Object.values(manifest.standalone?.categories ?? {})) {
      for (const mod of category.modules) {
        if (!availableStandalone.has(mod.id)) continue
        const prog = getModuleProgress('standalone', mod.level, mod.id)
        if (prog.completed) m[`standalone/${mod.id}`] = 'done'
        else if (prog.lastSection !== null || prog.completedSections.length > 0) {
          m[`standalone/${mod.id}`] = 'started'
        }
      }
    }

    setProgress(p)
    setCtas(c)
    setModuleStates(m)
  }, [manifest, writtenModules, writtenStandalone])

  const sections = useMemo<CatalogSection[]>(() => {
    const flat: CatalogSection[] = []
    for (const [trackId, track] of Object.entries(manifest.tracks)) {
      for (const levelId of LEVEL_ORDER.filter(l => track.levels[l])) {
        const level = track.levels[levelId]
        const written = writtenModules[`${trackId}/${levelId}`] ?? []
        flat.push({
          key: `${trackId}/${levelId}`,
          trackId,
          levelId,
          // "PHP App Track — Beginner", as in the reference design.
          title: `${track.title} — ${level.title}`,
          estimatedHours: level.estimated_hours,
          firstWrittenIndex: level.modules.find(m => written.includes(m.index))?.index ?? null,
          modules: level.modules.map(m => ({
            key: `${trackId}/${levelId}/${m.index}`,
            trackId,
            levelId,
            index: m.index,
            title: m.title,
            description: m.description,
            minutes: m.estimated_minutes,
            available: written.includes(m.index),
          })),
        })
      }
    }
    return flat
  }, [manifest, writtenModules])

  /** Hero figures, all derived from the manifest plus what is written. */
  const stats = useMemo(() => {
    let writtenMinutes = 0
    let writtenCount = 0
    let plannedCount = 0

    for (const [trackId, track] of Object.entries(manifest.tracks)) {
      for (const [levelId, level] of Object.entries(track.levels)) {
        const written = writtenModules[`${trackId}/${levelId}`] ?? []
        plannedCount += level.modules.length
        writtenCount += written.length
        writtenMinutes += level.modules
          .filter(m => written.includes(m.index))
          .reduce((sum, m) => sum + m.estimated_minutes, 0)
      }
    }

    return {
      tracks: Object.keys(manifest.tracks).length,
      written: writtenCount,
      hours: Math.round(writtenMinutes / 60),
      planned: plannedCount,
    }
  }, [manifest, writtenModules])

  const levelIds = useMemo(
    () => LEVEL_ORDER.filter(l => sections.some(s => s.levelId === l)),
    [sections],
  )

  const matches = (mod: CatalogModule) => {
    if (trackFilter !== 'all' && trackFilter !== mod.trackId) return false
    if (levelFilter !== 'all' && levelFilter !== mod.levelId) return false
    if (timeFilter === 'all') return true
    const bucket = TIME_BUCKETS.find(b => b.id === timeFilter)
    if (!bucket) return true
    return mod.minutes >= bucket.min && (bucket.max === null || mod.minutes <= bucket.max)
  }

  /*
   * Filtering happens per module, and a section drops out when nothing in it
   * survives - so "≤30 min" cannot leave an empty "PHP App Track — Advanced"
   * heading behind with no cards under it.
   */
  const visibleSections = sections
    .map(section => ({ ...section, modules: section.modules.filter(matches) }))
    .filter(section => section.modules.length > 0)

  const visibleCount = visibleSections.reduce((sum, s) => sum + s.modules.length, 0)
  const totalCount = sections.reduce((sum, s) => sum + s.modules.length, 0)

  /**
   * The renderable standalone modules, shaped as CatalogModules so they render
   * through the same ModuleCard as every track module.
   *
   * `index` is 0 because a standalone module has no position in a track, so
   * `href` and `eyebrow` are supplied instead of being derived from it.
   * Availability is a filesystem fact decided on the server and passed in,
   * matching how writtenModules works for track modules.
   */
  const standaloneModules = useMemo<CatalogModule[]>(() => {
    const available = new Set(writtenStandalone)
    return Object.values(manifest.standalone?.categories ?? {})
      .flatMap(category => category.modules)
      .filter(mod => available.has(mod.id))
      .map(mod => ({
        key: `standalone/${mod.id}`,
        trackId: 'standalone',
        levelId: mod.level,
        index: 0,
        title: mod.title,
        description: mod.description,
        minutes: mod.estimated_minutes,
        available: true,
        href: `/standalone/${mod.id}`,
        eyebrow: 'Standalone',
      }))
  }, [manifest, writtenStandalone])

  return (
    <div className="min-h-screen flex flex-col">
      <TopBar />

      {/* Hero */}
      <section className="relative overflow-hidden bg-linear-to-br from-navy via-navy-mid via-60% to-nc-blue py-16 md:py-20">
        {/* Light bloom on the right, as in the reference design. */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_at_80%_50%,rgba(0,130,201,0.35)_0%,transparent_60%)]"
        />
        {/* Padding lives here, not on the section, so the hero's text starts on
            the same line as the filter bar and the track sections below it. */}
        <div className="relative mx-auto max-w-[1200px] px-6 md:px-8">
          <p className="mb-4 font-mono text-xs uppercase tracking-[0.12em] text-white/50">
            Nextcloud · Developer Education
          </p>
          <h1 className="mb-5 max-w-[640px] text-4xl font-bold leading-[1.15] tracking-[-0.02em] text-white md:text-5xl lg:text-[3.2rem]">
            Build apps for<br />
            <span className="bg-linear-to-r from-[#1cafff] to-[#7dd3fc] bg-clip-text text-transparent">
              30 million users
            </span>
          </h1>
          <p className="mb-9 max-w-[520px] text-lg leading-relaxed text-white/70">
            Hands-on, project-based courses for developers building on Nextcloud. Two tracks, same
            app - choose your language and architecture.
          </p>
          <dl className="flex flex-wrap gap-x-9 gap-y-5">
            {[
              { value: stats.tracks, label: 'tracks' },
              { value: stats.written, label: 'modules available now' },
              { value: `~${stats.hours}h`, label: 'written content' },
              { value: stats.planned, label: 'modules planned' },
            ].map(stat => (
              <div key={stat.label}>
                <dd className="font-mono text-2xl font-semibold leading-none text-white">{stat.value}</dd>
                <dt className="mt-1 text-xs text-white/50">{stat.label}</dt>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Filter bar */}
      <div className="sticky top-14 z-40 border-b border-rule bg-white shadow-[0_2px_8px_rgba(0,0,0,0.04)]">
        <div className="mx-auto flex h-14 max-w-[1200px] items-center gap-2 overflow-x-auto px-6 md:px-8">
          <span className="mr-1 shrink-0 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted">
            Filter
          </span>

          <FilterChip active={trackFilter === 'all'} onClick={() => setTrackFilter('all')}>
            All tracks
          </FilterChip>
          {Object.keys(manifest.tracks).map(trackId => (
            <FilterChip
              key={trackId}
              active={trackFilter === trackId}
              onClick={() => setTrackFilter(trackId)}
            >
              {trackStyle(trackId).glyph} {trackStyle(trackId).label}
            </FilterChip>
          ))}

          <span aria-hidden="true" className="mx-2 h-5 w-px shrink-0 bg-rule" />

          <FilterChip active={levelFilter === 'all'} onClick={() => setLevelFilter('all')}>
            All levels
          </FilterChip>
          {levelIds.map(levelId => (
            <FilterChip
              key={levelId}
              active={levelFilter === levelId}
              onClick={() => setLevelFilter(levelId)}
            >
              <span className="capitalize">{levelId}</span>
            </FilterChip>
          ))}

          <span aria-hidden="true" className="mx-2 h-5 w-px shrink-0 bg-rule" />

          <FilterChip active={timeFilter === 'all'} onClick={() => setTimeFilter('all')}>
            Any length
          </FilterChip>
          {TIME_BUCKETS.map(bucket => (
            <FilterChip
              key={bucket.id}
              active={timeFilter === bucket.id}
              onClick={() => setTimeFilter(bucket.id)}
            >
              {bucket.label}
            </FilterChip>
          ))}

          <span className="ml-auto shrink-0 pl-4 font-mono text-xs text-muted" aria-live="polite">
            {visibleCount === totalCount ? `${totalCount} modules` : `${visibleCount} of ${totalCount} modules`}
          </span>
        </div>
      </div>

      <main className="mx-auto w-full max-w-[1200px] flex-1 px-6 pb-20 pt-12 md:px-8">
        {/*
          * "Before you start" sits above the tracks because the one module in
          * it is a prerequisite for both of them: php/beginner/1 tells readers
          * to come here first. Only modules whose markdown exists are listed,
          * so the fifteen declared-but-unwritten standalone modules stay
          * hidden rather than becoming dead links.
          */}
        {standaloneModules.length > 0 && (
          <section className="mb-14">
            <div className="mb-6 flex flex-wrap items-center gap-4 border-b-2 border-rule pb-4">
              <span className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold tracking-[0.04em] ${trackStyle('standalone').badge}`}>
                {trackStyle('standalone').glyph} {trackStyle('standalone').label}
              </span>
              <h2 className="text-xl font-semibold text-ink">Before you start</h2>
              <span className="font-mono text-sm text-muted">
                {standaloneModules.length} {standaloneModules.length === 1 ? 'module' : 'modules'} · no track required
              </span>
            </div>
            <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
              {standaloneModules.map(mod => (
                <ModuleCard key={mod.key} mod={mod} state={moduleStates[mod.key]} />
              ))}
            </div>
          </section>
        )}

        {visibleSections.map(section => {
          const style = trackStyle(section.trackId)
          const written = section.modules.filter(m => m.available).length
          const percent = progress[section.key] ?? 0
          const cta = ctas[section.key]
          // Pre-hydration, and for a level whose modules are all filtered out.
          const fallbackHref = section.firstWrittenIndex !== null
            ? `/${section.trackId}/${section.levelId}/${section.firstWrittenIndex}`
            : `/${section.trackId}/${section.levelId}`

          return (
            <section key={section.key} className="mb-14">
              <div className="mb-6 flex flex-wrap items-center gap-4 border-b-2 border-rule pb-4">
                <span className={`flex items-center gap-2 rounded-md px-3.5 py-1.5 font-mono text-xs font-semibold tracking-[0.04em] ${style.badge}`}>
                  {style.glyph} {style.label}
                </span>
                <h2 className="text-xl font-semibold text-ink">{section.title}</h2>
                <span className="font-mono text-sm text-muted">
                  {/*
                    * The reference design says a bare "coming soon" for a level
                    * with nothing written, rather than advertising a module count
                    * and duration nobody can read yet.
                    */}
                  {written === 0
                    ? 'coming soon'
                    : `${section.modules.length} modules · ~${section.estimatedHours}h`}
                </span>
                {/*
                  * Progress as a coloured pill rather than grey run-on text:
                  * it is the one number a returning reader looks for, and it
                  * went unnoticed sitting inside the meta line.
                  */}
                {percent > 0 && (
                  <span
                    className={`rounded-full px-2.5 py-1 font-mono text-xs font-semibold ${
                      percent === 100
                        ? 'bg-nc-green-light text-nc-green-dark'
                        : 'bg-nc-blue-light text-nc-blue-dark'
                    }`}
                  >
                    {percent}% complete
                  </span>
                )}
                {written > 0 && (
                  <Link
                    href={cta?.href ?? fallbackHref}
                    className={`ml-auto inline-flex items-center gap-1.5 rounded-md px-4.5 py-2 text-sm font-semibold text-white transition-colors ${
                      cta?.done ? 'bg-nc-green-dark hover:bg-[#276b3a]' : 'bg-nc-blue hover:bg-nc-blue-dark'
                    }`}
                  >
                    {cta?.done && <span aria-hidden="true">✓</span>}
                    {cta?.label ?? 'Start track →'}
                  </Link>
                )}
              </div>

              <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-4">
                {section.modules.map(mod => (
                  <ModuleCard key={mod.key} mod={mod} state={moduleStates[mod.key]} />
                ))}
              </div>
            </section>
          )
        })}

        {visibleSections.length === 0 && (
          <div className="py-16 text-center text-muted">
            <div className="text-3xl" aria-hidden="true">🔍</div>
            <p className="mt-2">No modules match the current filters.</p>
          </div>
        )}
      </main>

      <footer className="border-t border-rule bg-white py-6">
        <div className="mx-auto flex max-w-[1200px] flex-wrap items-center justify-between gap-3 px-6 text-xs text-muted md:px-8">
          <span>{manifest.course.title} · v{manifest.course.version}</span>
          <div className="flex gap-5">
            <a
              href="https://docs.nextcloud.com/server/latest/developer_manual/"
              target="_blank"
              rel="noopener noreferrer"
              className="hover:text-nc-blue"
            >
              Official docs ↗
            </a>
            <a href={REPO_URL} target="_blank" rel="noopener noreferrer" className="hover:text-nc-blue">
              GitHub ↗
            </a>
          </div>
        </div>
      </footer>
    </div>
  )
}

function FilterChip({
  active,
  onClick,
  children,
}: {
  active: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${CHIP_BASE} ${
        active
          ? 'border-nc-blue bg-nc-blue text-white'
          : 'border-rule bg-white text-muted hover:border-nc-blue hover:text-nc-blue'
      }`}
    >
      {children}
    </button>
  )
}

const CARD_SHELL =
  'group relative flex flex-col gap-2.5 overflow-hidden rounded-lg border p-5 transition-all'

/**
 * One module, as a card - the granularity the reference design uses on the
 * landing page.
 *
 * A written module is a single anchor: icon, id, title, tagline and footer are
 * all inside it, so a click anywhere on the card navigates, and keyboard and
 * middle-click behaviour come for free.
 *
 * A module that exists only in the manifest is not a link at all - its page
 * would 404 - so it renders as an inert div. Nothing to click, nothing in the
 * tab order.
 */
function ModuleCard({ mod, state }: { mod: CatalogModule; state?: ModuleState }) {
  const style = trackStyle(mod.trackId)
  const done = state === 'done'

  const body = (
    <>
      {mod.available ? (
        <span
          aria-hidden="true"
          className={`absolute inset-x-0 top-0 h-[3px] transition-opacity ${
            // A finished module keeps its rule on permanently, so completion is
            // legible without hovering.
            done ? 'bg-nc-green opacity-100' : 'bg-nc-blue opacity-0 group-hover:opacity-100'
          }`}
        />
      ) : (
        /*
         * Hover treatment for a planned module: the card tints and a "Coming
         * soon" plate fades in over it. Decorative and aria-hidden.
         *
         * This deliberately repeats the "Soon" badge in the card header - don't
         * remove either one. The badge is quiet enough to skim past, so the
         * hover plate is what actually lands; the badge is what touch devices
         * and screen readers get, since neither ever sees a hover state.
         */
        <span
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center bg-rule/70 opacity-0 backdrop-blur-[1px] transition-opacity duration-200 group-hover:opacity-100"
        >
          <span className="rounded-md bg-white/90 px-3 py-1.5 font-mono text-xs font-semibold uppercase tracking-[0.08em] text-muted shadow-sm">
            Coming soon
          </span>
        </span>
      )}

      <div className="flex items-start gap-3">
        <span
          aria-hidden="true"
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-lg ${
            mod.available ? style.icon : 'bg-rule text-muted grayscale'
          }`}
        >
          {style.glyph}
        </span>
        <div className="flex-1">
          <div className="font-mono text-[0.68rem] uppercase tracking-[0.06em] text-muted">
            {mod.eyebrow ?? `M${mod.index} · ${style.label}`}
          </div>
          <div className={`font-semibold leading-tight ${mod.available ? 'text-ink' : 'text-muted'}`}>
            {mod.title}
          </div>
        </div>
        {/*
          * State badge. Every state spells the word out as well as colouring it,
          * so nothing here depends on distinguishing green from blue.
          */}
        {!mod.available ? (
          <span className="shrink-0 rounded bg-rule px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-muted">
            Soon
          </span>
        ) : done ? (
          <span className="flex shrink-0 items-center gap-1 rounded bg-nc-green-light px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-nc-green-dark">
            <span aria-hidden="true">✓</span> Done
          </span>
        ) : state === 'started' ? (
          <span className="shrink-0 rounded bg-nc-blue-light px-2 py-0.5 font-mono text-[0.65rem] font-semibold uppercase tracking-[0.08em] text-nc-blue-dark">
            In progress
          </span>
        ) : null}
      </div>

      {/*
        * Clamped to three lines to match the level taglines, which are the
        * design's rhythm. The manifest's `description` is written as prose for
        * the module page rather than as a card tagline, so some run long; the
        * full text is never lost, it is on the module page itself.
        *
        * `flex-1` has to sit on the wrapper, not on the clamped paragraph.
        * line-clamp works by capping a `-webkit-box`'s visible lines and hiding
        * the overflow; growing that same box with flex makes it tall enough to
        * show the "hidden" lines, so the ellipsis lands at line three and the
        * text carries on past it. The number of lines then depended on how many
        * lines the heading above took, which is not a clamp at all.
        */}
      <div className="flex-1">
        <p className="line-clamp-3 text-sm leading-relaxed text-muted">{mod.description}</p>
      </div>

      <div className="mt-auto flex items-center justify-between border-t border-rule pt-2.5">
        <span className="font-mono text-[0.72rem] text-muted">⏱ {mod.minutes} min</span>
        <span className={`rounded px-2 py-0.5 font-mono text-[0.7rem] font-semibold uppercase tracking-[0.05em] ${LEVEL_BADGE[mod.levelId] ?? 'bg-rule text-muted'}`}>
          {mod.levelId}
        </span>
      </div>
    </>
  )

  if (!mod.available) {
    return (
      <div className={`${CARD_SHELL} cursor-default select-none border-rule bg-rule/45`}>
        {body}
      </div>
    )
  }

  return (
    <Link
      href={mod.href ?? `/${mod.trackId}/${mod.levelId}/${mod.index}`}
      className={`${CARD_SHELL} border-rule bg-white hover:-translate-y-0.5 hover:border-nc-blue hover:shadow-[0_2px_12px_rgba(0,0,0,0.08)]`}
    >
      {body}
    </Link>
  )
}
