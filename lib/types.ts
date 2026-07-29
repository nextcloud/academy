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
  /**
   * Stable identifier for this section, used as the progress key.
   *
   * Derived from an explicit `{#anchor}` on the heading when present, otherwise
   * slugified from the heading text. Never from the section's position, so
   * inserting or reordering sections does not shift anyone's saved progress.
   */
  id: string
}

export interface ModuleProgress {
  /** Stable section ids (see {@link Section.id}), not positions. */
  completedSections: string[]
  completed: boolean
  /** Stable id of the furthest section reached, or null if none. */
  lastSection: string | null
  /**
   * Section *positions* recovered from a v1 store, still awaiting translation
   * into ids. Only the module player can do that, since only it knows the
   * module's sections. Deleted once migrated.
   */
  legacySections?: number[]
}

export interface ProgressStore {
  /** Schema version, so future changes can migrate instead of misreading. */
  version: number
  modules: Record<string, ModuleProgress>
}

export interface User {
  id: string
  email: string
  name: string
}
