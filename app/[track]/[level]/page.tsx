import { getTrack, getLevel } from '@/lib/manifest'
import { notFound } from 'next/navigation'
import LevelCatalogClient from '@/components/LevelCatalogClient'
import { getAllLevelParams } from '@/lib/manifest'

export default async function LevelPage({
  params,
}: {
  params: Promise<{ track: string; level: string }>
}) {
  const { track, level } = await params
  const trackData = getTrack(track)
  const levelData = getLevel(track, level)
  if (!trackData || !levelData) notFound()

  return <LevelCatalogClient track={trackData} level={levelData} trackId={track} levelId={level} />
}

export function generateStaticParams() {
  return getAllLevelParams()
}
