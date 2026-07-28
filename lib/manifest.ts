import manifest from '@/content/course-manifest.json'
import type { CourseManifest, Track, Level, Module } from './types'

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
