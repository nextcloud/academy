'use client'

import type { ModuleProgress, ProgressStore } from './types'

const STORAGE_KEY = 'course_progress'

export function getProgress(): ProgressStore {
  if (typeof window === 'undefined') return {}
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}')
  } catch {
    return {}
  }
}

function saveProgress(store: ProgressStore) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(store))
}

export function getModuleProgress(track: string, level: string, moduleIndex: number): ModuleProgress {
  const key = `${track}/${level}/${moduleIndex}`
  return getProgress()[key] ?? { completedSections: [], completed: false, lastSection: 0 }
}

export function markSectionVisited(track: string, level: string, moduleIndex: number, sectionIndex: number) {
  const store = getProgress()
  const key = `${track}/${level}/${moduleIndex}`
  const current = store[key] ?? { completedSections: [], completed: false, lastSection: 0 }
  if (!current.completedSections.includes(sectionIndex)) {
    current.completedSections.push(sectionIndex)
  }
  current.lastSection = Math.max(current.lastSection, sectionIndex)
  store[key] = current
  saveProgress(store)
}

export function markModuleComplete(track: string, level: string, moduleIndex: number, totalSections: number) {
  const store = getProgress()
  const key = `${track}/${level}/${moduleIndex}`
  store[key] = {
    completedSections: Array.from({ length: totalSections }, (_, i) => i),
    completed: true,
    lastSection: totalSections - 1,
  }
  saveProgress(store)
}

export function getLevelProgress(track: string, level: string, totalModules: number): number {
  const store = getProgress()
  let completed = 0
  for (let i = 1; i <= totalModules; i++) {
    const key = `${track}/${level}/${i}`
    if (store[key]?.completed) completed++
  }
  return Math.round((completed / totalModules) * 100)
}
