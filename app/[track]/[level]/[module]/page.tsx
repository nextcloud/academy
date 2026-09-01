import { getModule, getAdjacentModules, getLevel, getTrack } from '@/lib/manifest'
import { getModuleContent, splitIntoSections, parseModuleHeader } from '@/lib/content'
import { notFound } from 'next/navigation'
import ModulePlayerClient from '@/components/ModulePlayerClient'
import { getAllModuleParams } from '@/lib/manifest'

export default async function ModulePage({
  params,
}: {
  params: Promise<{ track: string; level: string; module: string }>
}) {
  const { track, level, module: moduleParam } = await params
  const moduleIndex = parseInt(moduleParam, 10)
  if (isNaN(moduleIndex)) notFound()

  const trackData = getTrack(track)
  const levelData = getLevel(track, level)
  const moduleData = getModule(track, level, moduleIndex)
  if (!trackData || !levelData || !moduleData) notFound()

  const content = getModuleContent(track, level, moduleIndex)
  if (!content) notFound()

  const sections = splitIntoSections(content)
  const { title } = parseModuleHeader(content)
  const { prev, next } = getAdjacentModules(track, level, moduleIndex)

  return (
    <ModulePlayerClient
      trackId={track}
      levelId={level}
      moduleIndex={moduleIndex}
      trackTitle={trackData.title}
      levelTitle={levelData.title}
      moduleTitle={title}
      moduleData={moduleData}
      sections={sections}
      prevModule={prev}
      nextModule={next}
    />
  )
}

export function generateStaticParams() {
  return getAllModuleParams()
}
