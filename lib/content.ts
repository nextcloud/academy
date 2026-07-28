import fs from 'fs'
import path from 'path'
import type { Section } from './types'

const CONTENT_DIR = path.join(process.cwd(), 'content')

export function getModuleContent(trackId: string, levelId: string, moduleIndex: number): string | null {
  const filePath = path.join(CONTENT_DIR, trackId, levelId, `${moduleIndex}.md`)
  if (!fs.existsSync(filePath)) return null
  return fs.readFileSync(filePath, 'utf-8')
}

export function parseModuleHeader(markdown: string): { title: string; meta: string } {
  const lines = markdown.split('\n')
  const titleLine = lines.find(l => l.startsWith('# '))
  const title = titleLine ? titleLine.replace(/^# /, '') : 'Module'

  const firstSectionIndex = lines.findIndex(l => l.startsWith('## '))
  const metaLines = firstSectionIndex > 0 ? lines.slice(0, firstSectionIndex) : []
  const meta = metaLines.filter(l => !l.startsWith('# ')).join('\n').trim()

  return { title, meta }
}

export function splitIntoSections(markdown: string): Section[] {
  const lines = markdown.split('\n')
  const sections: Section[] = []
  let currentTitle = ''
  let currentLines: string[] = []
  let sectionIndex = 0

  for (const line of lines) {
    if (line.startsWith('## ')) {
      if (currentTitle) {
        sections.push({
          title: currentTitle,
          content: currentLines.join('\n').trim(),
          index: sectionIndex++,
        })
        currentLines = []
      }
      currentTitle = line.replace(/^## /, '')
    } else if (currentTitle) {
      currentLines.push(line)
    }
  }

  if (currentTitle) {
    sections.push({
      title: currentTitle,
      content: currentLines.join('\n').trim(),
      index: sectionIndex,
    })
  }

  return sections
}
