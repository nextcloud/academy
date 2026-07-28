export interface Module {
  id: string
  index: number
  title: string
  description: string
  estimated_minutes: number
  git_tag_start: string | null
  git_tag_end: string | null
}

export interface Level {
  id: string
  title: string
  tagline: string
  estimated_hours: string
  modules: Module[]
}

export interface Track {
  id: string
  title: string
  tagline: string
  levels: Record<string, Level>
}

export interface CourseManifest {
  course: { id: string; title: string; version: string }
  tracks: Record<string, Track>
}

export interface Section {
  title: string
  content: string
  index: number
}

export interface ModuleProgress {
  completedSections: number[]
  completed: boolean
  lastSection: number
}

export type ProgressStore = Record<string, ModuleProgress>

export interface User {
  id: string
  email: string
  name: string
}
