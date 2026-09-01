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
}

export default nextConfig
