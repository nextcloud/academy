'use client'

import type { ModuleProgress, ProgressStore, Section } from './types'

const STORAGE_KEY = 'course_progress'

export const PROGRESS_VERSION = 2

const emptyModule = (): ModuleProgress => ({
  completedSections: [],
  completed: false,
  lastSection: null,
})

/**
 * Progress is keyed by the module's manifest id, not its position, so
 * reordering modules cannot reattribute progress to a different module.
 */
export function moduleKey(track: string, level: string, moduleId: string): string {
  return `${track}/${level}/${moduleId}`
}

/** The key format used by the v1 store, which keyed on module position. */
function legacyModuleKey(track: string, level: string, moduleIndex: number): string {
  return `${track}/${level}/${moduleIndex}`
}

interface LegacyModuleProgress {
  completedSections?: number[]
  completed?: boolean
  lastSection?: number
}

/**
 * Reads the v1 store and lifts it into the current shape.
 *
 * v1 recorded section *positions* and keyed modules by position too. Positions
 * cannot be resolved to ids here, because that needs the module's content;
 * they are parked in `legacySections` and translated by the module player via
 * {@link migrateLegacySections}. Everything that does not depend on ids
 * (whether a module is complete, whether it was started) survives immediately.
 */
function migrateV1(raw: Record<string, LegacyModuleProgress>): ProgressStore {
  const modules: Record<string, ModuleProgress> = {}

  for (const [key, value] of Object.entries(raw)) {
    if (!value || typeof value !== 'object') continue
    const positions = Array.isArray(value.completedSections) ? value.completedSections : []
    modules[key] = {
      completedSections: [],
      completed: value.completed === true,
      lastSection: null,
      ...(positions.length > 0 ? { legacySections: positions } : {}),
    }
  }

  return { version: PROGRESS_VERSION, modules }
}

export function getProgress(): ProgressStore {
  if (typeof window === 'undefined') return { version: PROGRESS_VERSION, modules: {} }

  let parsed: unknown
  try {
    parsed = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? 'null')
  } catch {
    return { version: PROGRESS_VERSION, modules: {} }
  }

  if (!parsed || typeof parsed !== 'object') {
    return { version: PROGRESS_VERSION, modules: {} }
  }

  const candidate = parsed as Partial<ProgressStore>
  if (candidate.version === PROGRESS_VERSION && candidate.modules) {
    return { version: PROGRESS_VERSION, modules: candidate.modules }
  }

  // No version field at all: the v1 store, which was a bare
  // Record<moduleKey, { completedSections: number[], ... }>.
  if (candidate.version === undefined) {
    return migrateV1(parsed as Record<string, LegacyModuleProgress>)
  }

  // A version we do not recognise, i.e. written by a newer build. Leave it
  // alone rather than clobbering it, and start this session empty.
  return { version: PROGRESS_VERSION, modules: {} }
}

function saveProgress(store: ProgressStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getModuleProgress(
  track: string,
  level: string,
  moduleId: string,
  moduleIndex?: number,
): ModuleProgress {
  const store = getProgress()
  const current = store.modules[moduleKey(track, level, moduleId)]
  if (current) return current

  // Fall back to the v1 position-based key so readers who started before the
  // id-based keys landed still see their progress.
  if (moduleIndex !== undefined) {
    const legacy = store.modules[legacyModuleKey(track, level, moduleIndex)]
    if (legacy) return legacy
  }

  return emptyModule()
}

function updateModule(
  track: string,
  level: string,
  moduleId: string,
  moduleIndex: number | undefined,
  update: (current: ModuleProgress) => ModuleProgress,
) {
  const store = getProgress()
  const key = moduleKey(track, level, moduleId)
  const current = store.modules[key]
    ?? (moduleIndex !== undefined ? store.modules[legacyModuleKey(track, level, moduleIndex)] : undefined)
    ?? emptyModule()

  store.modules[key] = update(current)

  // Retire the old key once its data lives under the id-based one, so the two
  // cannot drift apart.
  if (moduleIndex !== undefined) {
    delete store.modules[legacyModuleKey(track, level, moduleIndex)]
  }

  saveProgress(store)
}

/**
 * Translates parked v1 section positions into stable ids, now that the caller
 * has the module's sections in hand.
 *
 * Best-effort by nature: if the content changed between the reader's last visit
 * and now, some positions will map to the wrong section. That is still strictly
 * better than v1, where every insertion silently shifted *all* later sections.
 * Out-of-range positions are dropped rather than guessed at.
 */
export function migrateLegacySections(
  track: string,
  level: string,
  moduleId: string,
  moduleIndex: number,
  sections: Section[],
) {
  const store = getProgress()
  const key = moduleKey(track, level, moduleId)
  const legacyKey = legacyModuleKey(track, level, moduleIndex)
  const current = store.modules[key] ?? store.modules[legacyKey]

  if (!current?.legacySections?.length) return

  const recovered = current.legacySections
    .map(position => sections[position]?.id)
    .filter((id): id is string => typeof id === 'string')

  const merged = [...new Set([...current.completedSections, ...recovered])]

  store.modules[key] = {
    completedSections: merged,
    completed: current.completed,
    lastSection: merged.length > 0 ? merged[merged.length - 1] : null,
  }
  delete store.modules[legacyKey]

  saveProgress(store)
}

/**
 * Records a move between sections.
 *
 * `visitedId` is the section being left, which counts as read. `currentId` is
 * the section being entered, and becomes the resume point — deliberately the
 * *current* section rather than the furthest one, so a reader who navigates
 * back to re-read something resumes there rather than being thrown forward.
 */
export function recordSectionChange(
  track: string,
  level: string,
  moduleId: string,
  visitedId: string,
  currentId: string,
  moduleIndex?: number,
) {
  updateModule(track, level, moduleId, moduleIndex, current => ({
    ...current,
    completedSections: current.completedSections.includes(visitedId)
      ? current.completedSections
      : [...current.completedSections, visitedId],
    lastSection: currentId,
  }))
}

export function markModuleComplete(
  track: string,
  level: string,
  moduleId: string,
  sectionIds: string[],
  moduleIndex?: number,
) {
  updateModule(track, level, moduleId, moduleIndex, () => ({
    completedSections: [...sectionIds],
    completed: true,
    lastSection: sectionIds.length > 0 ? sectionIds[sectionIds.length - 1] : null,
  }))
}

/**
 * Percentage of a level's modules marked complete.
 *
 * Takes each module's id *and* its manifest index: the id is the current key,
 * the index is needed to find progress still stored under the v1 position-based
 * key. Deriving the index from array order would break for any level whose
 * manifest indices aren't a contiguous 1..n run.
 */
export function getLevelProgress(
  track: string,
  level: string,
  modules: Array<{ id: string; index: number }>,
): number {
  if (modules.length === 0) return 0
  const store = getProgress()
  let completed = 0
  for (const { id, index } of modules) {
    const entry = store.modules[moduleKey(track, level, id)]
      ?? store.modules[legacyModuleKey(track, level, index)]
    if (entry?.completed) completed++
  }
  return Math.round((completed / modules.length) * 100)
}
