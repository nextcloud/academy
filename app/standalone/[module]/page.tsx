import { getStandaloneModule, getAllStandaloneParams } from '@/lib/manifest'
import { getStandaloneContent, splitIntoSections, parseModuleHeader } from '@/lib/content'
import { notFound } from 'next/navigation'
import ModulePlayerClient from '@/components/ModulePlayerClient'

/**
 * A standalone module page.
 *
 * Standalone modules are read by the same player as track modules, so
 * progress, section navigation and the feedback link all behave identically.
 * The differences are that there is no previous or next module, and that
 * "back" goes to the catalogue rather than to a level listing.
 *
 * Progress is keyed `standalone/<level>/<module id>`, which slots into the
 * existing `moduleKey(track, level, moduleId)` scheme without special-casing
 * the progress store. `moduleIndex` is 0 because a standalone module has no
 * position in a track; track modules are 1-indexed, so the player uses that to
 * suppress the "M1." prefix.
 */
export default async function StandaloneModulePage({
  params,
}: {
  params: Promise<{ module: string }>
}) {
  const { module: moduleId } = await params

  const moduleData = getStandaloneModule(moduleId)
  if (!moduleData?.file) notFound()

  const content = getStandaloneContent(moduleData.file)
  if (!content) notFound()

  const sections = splitIntoSections(content)
  const { title } = parseModuleHeader(content)

  return (
    <ModulePlayerClient
      trackId="standalone"
      levelId={moduleData.level}
      moduleIndex={0}
      trackTitle="Standalone"
      levelTitle={moduleData.title}
      moduleTitle={title}
      moduleData={{
        id: moduleData.id,
        index: 0,
        title: moduleData.title,
        description: moduleData.description,
        estimated_minutes: moduleData.estimated_minutes,
        git_tag_start: null,
        git_tag_end: null,
      }}
      sections={sections}
      prevModule={null}
      nextModule={null}
      backHref="/"
      backLabel="All modules"
    />
  )
}

export function generateStaticParams() {
  return getAllStandaloneParams()
}
