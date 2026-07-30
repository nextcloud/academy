import fs from 'fs'
import path from 'path'
import type { CourseManifest, Section } from './types'

const CONTENT_DIR = path.join(process.cwd(), 'content')

function moduleContentPath(trackId: string, levelId: string, moduleIndex: number): string {
  return path.join(CONTENT_DIR, trackId, levelId, `${moduleIndex}.md`)
}

export function getModuleContent(trackId: string, levelId: string, moduleIndex: number): string | null {
  const filePath = moduleContentPath(trackId, levelId, moduleIndex)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
}

/**
 * Which modules of each level actually have content written, keyed by
 * `track/level` and listing manifest module indices.
 *
 * The manifest describes the whole planned syllabus, including levels nobody
 * has written yet, so the catalog cannot tell "ready to read" from "planned"
 * from the manifest alone. Answering that from the filesystem keeps the two in
 * sync automatically: writing `content/php/intermediate/1.md` is all it takes
 * for the catalog to stop calling that level unwritten.
 */
export function getWrittenModules(manifest: CourseManifest): Record<string, number[]> {
  const written: Record<string, number[]> = {}
  for (const [trackId, track] of Object.entries(manifest.tracks)) {
    for (const [levelId, level] of Object.entries(track.levels)) {
      written[`${trackId}/${levelId}`] = level.modules
        .filter(m => fs.existsSync(moduleContentPath(trackId, levelId, m.index)))
        .map(m => m.index)
    }
  }
  return written
}

/**
 * Resolves a standalone module's `file` to an absolute path, or null if it
 * points outside the content tree.
 *
 * `file` comes from the manifest and is relative to `content/`. The
 * containment check catches a stray `../` in a manifest entry; it is not a
 * sandbox, since a symlink committed inside `content/` could still resolve
 * elsewhere. The manifest is source code in this repository, so a typo is the
 * threat model here, not an attacker.
 *
 * Mirrors moduleContentPath() for track modules.
 */
export function standaloneContentPath(file: string): string | null {
  const filePath = path.resolve(CONTENT_DIR, file)
  if (!filePath.startsWith(CONTENT_DIR + path.sep)) return null
  return filePath
}

/**
 * The path to a standalone module's markdown, if it is a readable regular
 * file. Null covers all three ways a manifest entry can fail to name one:
 * escaping the content tree, not existing, or naming a directory.
 *
 * That last case is the reason this exists rather than a bare existsSync():
 * `"file": "shared"` instead of `"shared/setup.md"` is an easy typo, and
 * existsSync() says true for a directory. readFileSync() would then throw
 * EISDIR and take the build down, and route generation would emit a route that
 * 404s. Both should behave as "not written yet" instead.
 *
 * throwIfNoEntry: false makes a missing path return undefined rather than
 * throw, so the common case needs no try/catch.
 */
function standaloneContentFile(file: string): string | null {
  const filePath = standaloneContentPath(file)
  if (!filePath) return null
  const stat = fs.statSync(filePath, { throwIfNoEntry: false })
  return stat?.isFile() ? filePath : null
}

/** Reads a standalone module's markdown. */
export function getStandaloneContent(file: string): string | null {
  const filePath = standaloneContentFile(file)
  if (!filePath) return null
  return fs.readFileSync(filePath, 'utf-8')
}

/** Whether a standalone module's `file` names readable markdown. */
export function hasStandaloneContent(file: string): boolean {
  return standaloneContentFile(file) !== null
}

/**
 * The standalone modules that actually have content on disk.
 *
 * Gated on the file existing rather than on the manifest, for the same reason
 * as {@link getWrittenModules}: the standalone section declares sixteen
 * modules and one is written, so listing from the manifest alone would
 * advertise fifteen dead links.
 */
export function getWrittenStandaloneModules(manifest: CourseManifest): string[] {
  const ids: string[] = []
  for (const category of Object.values(manifest.standalone?.categories ?? {})) {
    for (const mod of category.modules) {
      if (mod.file && hasStandaloneContent(mod.file)) ids.push(mod.id)
    }
  }
  return ids
}

/**
 * Marks which lines sit inside a fenced code block.
 *
 * Course content is full of shell comments (`# Run from: …`) and embedded
 * examples containing real markdown headings — the CHANGELOG example in the
 * packaging modules has `## [Unreleased]` in it. Without this, such lines are
 * mistaken for section headings, which splits a code block down the middle and
 * invents empty sections.
 */
function fencedLineFlags(lines: string[]): boolean[] {
  let fenced = false
  return lines.map(line => {
    if (/^\s*(```|~~~)/.test(line)) {
      fenced = !fenced
      return true // the fence delimiter itself belongs to the block
    }
    return fenced
  })
}

export function parseModuleHeader(markdown: string): { title: string; meta: string } {
  const lines = markdown.split('\n')
  const fenced = fencedLineFlags(lines)

  const titleIndex = lines.findIndex((l, i) => !fenced[i] && l.startsWith('# '))
  const title = titleIndex >= 0 ? lines[titleIndex].replace(/^# /, '') : 'Module'

  const firstSectionIndex = lines.findIndex((l, i) => !fenced[i] && l.startsWith('## '))
  const metaLines = firstSectionIndex > 0 ? lines.slice(0, firstSectionIndex) : []
  const meta = metaLines
    .filter((l, i) => fenced[i] || !l.startsWith('# '))
    .join('\n')
    .trim()

  return { title, meta }
}

export function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[`*_~]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

/**
 * Splits a `## ` heading into its display title and its stable id.
 *
 * An explicit trailing `{#some-id}` wins, which lets content authors reword a
 * heading without invalidating saved progress. Otherwise the id is slugified
 * from the heading text.
 */
function parseHeading(headingText: string): { title: string; id: string } {
  const explicit = headingText.match(/^(.*?)\s*\{#([A-Za-z0-9_-]+)\}\s*$/)
  if (explicit) {
    return { title: explicit[1].trim(), id: explicit[2] }
  }
  return { title: headingText, id: slugify(headingText) }
}

export function splitIntoSections(markdown: string): Section[] {
  const lines = markdown.split('\n')
  const sections: Section[] = []
  const usedIds = new Map<string, number>()
  let currentHeading = ''
  let currentLines: string[] = []
  let sectionIndex = 0

  // Two headings can legitimately share text (e.g. "Common problems" in
  // several modules, or a repeated "Exercise"). Ids must stay unique within a
  // module, so disambiguate deterministically by order of first appearance:
  // the first "concepts" stays `concepts`, the next becomes `concepts-2`.
  const uniqueId = (id: string): string => {
    const base = id || 'section'
    const seen = usedIds.get(base) ?? 0
    usedIds.set(base, seen + 1)
    return seen === 0 ? base : `${base}-${seen + 1}`
  }

  /*
   * Section bodies in the source files end with a `---` separating them from the
   * next heading. Once each section is rendered on its own that separator has
   * nothing left to separate: it becomes a rule sitting directly above the
   * player's own navigation border, so the module ends in two stacked lines.
   *
   * Stripping it here keeps the raw markdown readable as a document - the rules
   * are useful when reading the file - without leaking into the rendered page.
   * Only trailing rules go; a rule used mid-section is real content.
   */
  const stripTrailingRule = (body: string): string =>
    body.replace(/(?:\n[ \t]*(?:-{3,}|\*{3,}|_{3,})[ \t]*)+$/, '').trimEnd()

  const push = (heading: string) => {
    const { title, id } = parseHeading(heading)
    sections.push({
      title,
      content: stripTrailingRule(currentLines.join('\n').trim()),
      index: sectionIndex++,
      id: uniqueId(id),
    })
  }

  const fenced = fencedLineFlags(lines)

  lines.forEach((line, i) => {
    // A `## ` inside a fenced block is example content, not a heading.
    if (!fenced[i] && line.startsWith('## ')) {
      if (currentHeading) {
        push(currentHeading)
        currentLines = []
      }
      currentHeading = line.replace(/^## /, '')
    } else if (currentHeading) {
      currentLines.push(line)
    }
  })

  if (currentHeading) {
    push(currentHeading)
  }

  return sections
}
