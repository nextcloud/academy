import manifest from '@/content/course-manifest.json'
import type { CourseManifest, Track, Level, Module, StandaloneModule } from './types'
import { getModuleContent, hasStandaloneContent } from './content'

export function getManifest(): CourseManifest {
  return manifest as CourseManifest
}

export function getTrack(trackId: string): Track | null {
  const m = getManifest()
  return m.tracks[trackId] ?? null
}

export function getLevel(trackId: string, levelId: string): Level | null {
  return getTrack(trackId)?.levels[levelId] ?? null
}

export function getModule(trackId: string, levelId: string, moduleIndex: number): Module | null {
  const level = getLevel(trackId, levelId)
  return level?.modules.find(m => m.index === moduleIndex) ?? null
}

export function getAdjacentModules(trackId: string, levelId: string, moduleIndex: number) {
  const level = getLevel(trackId, levelId)
  if (!level) return { prev: null, next: null }
  const sorted = [...level.modules].sort((a, b) => a.index - b.index)
  const pos = sorted.findIndex(m => m.index === moduleIndex)
  return {
    prev: pos > 0 ? sorted[pos - 1] : null,
    next: pos < sorted.length - 1 ? sorted[pos + 1] : null,
  }
}

/**
 * Every (track, level) pair in the manifest.
 *
 * Required by generateStaticParams() so the level pages can be statically
 * exported for GitHub Pages.
 */
export function getAllLevelParams(): { track: string; level: string }[] {
  const m = getManifest()
  return Object.entries(m.tracks).flatMap(([track, t]) =>
    Object.keys(t.levels).map((level) => ({ track, level })),
  )
}

/**
 * Every (track, level, module) triple that actually has a markdown file.
 *
 * Deliberately gated on the file existing rather than on the manifest: the
 * manifest declares 66 modules while only 16 are written (see academy#16), so
 * exporting from the manifest alone would emit 50 routes that immediately 404.
 */
export function getAllModuleParams(): { track: string; level: string; module: string }[] {
  const m = getManifest()
  const params: { track: string; level: string; module: string }[] = []
  for (const [track, t] of Object.entries(m.tracks)) {
    for (const [level, l] of Object.entries(t.levels)) {
      for (const mod of l.modules) {
        if (getModuleContent(track, level, mod.index) !== null) {
          params.push({ track, level, module: String(mod.index) })
        }
      }
    }
  }
  return params
}

/**
 * Looks a standalone module up by its manifest id, across all categories.
 *
 * Ids are unique across the standalone section, so the category is an
 * organisational detail the caller does not need to know.
 */
export function getStandaloneModule(id: string): StandaloneModule | null {
  const m = getManifest()
  for (const category of Object.values(m.standalone?.categories ?? {})) {
    const found = category.modules.find(mod => mod.id === id)
    if (found) return found
  }
  return null
}

/**
 * Every standalone module that has a `file` whose markdown exists.
 *
 * Same gate as getAllModuleParams(): route generation follows what is written,
 * not what is declared, so an unwritten module never becomes a 404.
 */
export function getAllStandaloneParams(): { module: string }[] {
  const m = getManifest()
  const params: { module: string }[] = []
  for (const category of Object.values(m.standalone?.categories ?? {})) {
    for (const mod of category.modules) {
      if (mod.file && hasStandaloneContent(mod.file)) params.push({ module: mod.id })
    }
  }
  return params
}
