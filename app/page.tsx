import { getManifest } from '@/lib/manifest'
import { getWrittenModules, getWrittenStandaloneModules } from '@/lib/content'
import CatalogClient from '@/components/CatalogClient'

export default function HomePage() {
  const manifest = getManifest()
  // Availability is a filesystem question, so it is answered here on the server
  // and handed to the client component alongside the manifest.
  return (
    <CatalogClient
      manifest={manifest}
      writtenModules={getWrittenModules(manifest)}
      writtenStandalone={getWrittenStandaloneModules(manifest)}
    />
  )
}
