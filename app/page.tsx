import { getManifest } from '@/lib/manifest'
import CatalogClient from '@/components/CatalogClient'

export default function HomePage() {
  const manifest = getManifest()
  return <CatalogClient manifest={manifest} />
}
