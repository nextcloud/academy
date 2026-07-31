import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  // Static export: GitHub Pages serves plain files, so there is no Next.js
  // server to render on demand. Every route must be pre-rendered at build time.
  output: 'export',

  // The site is served from https://<org>.github.io/academy/, not from the
  // domain root, so both routes and asset URLs need the project path prefix.
  // Drop both if a custom domain is configured later.
  basePath: '/academy',
  assetPrefix: '/academy',

  // Emit /path/index.html rather than /path.html, so GitHub Pages resolves
  // directory-style URLs without a trailing-slash redirect.
  trailingSlash: true,

  // next/image's optimiser needs a server; unoptimized keeps <Image> usable
  // in an export if it is introduced later.
  images: { unoptimized: true },

  // Let this site's dev server be reached over the LAN, not just localhost.
  //
  // Next blocks cross-origin requests to dev-only resources (/_next/*,
  // /__nextjs*) unless the Origin matches the host the server started on,
  // which is localhost by default. Opening `next dev` on the machine's network
  // IP instead - from a phone, a VM, or a second machine - therefore loads the
  // page but has its client chunks refused, so nothing interactive works.
  //
  // This affects contributors to this repository only. It has no effect on the
  // exported site readers visit, and nothing to do with the nextcloud-docker-dev
  // environment the course itself teaches.
  //
  // Wildcards match a whole dot-separated segment, so these cover the private
  // ranges.
  allowedDevOrigins: ['192.168.*.*', '10.*.*.*', '172.*.*.*'],
}

export default nextConfig
