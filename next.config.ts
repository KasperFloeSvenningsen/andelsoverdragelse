import type { NextConfig } from 'next'

const isProd = process.env.NODE_ENV === 'production'

const nextConfig: NextConfig = {
  reactStrictMode: true,
  output: 'export',
  // GitHub Pages serves from /andelsoverdragelse/ — only apply in prod builds
  basePath: isProd ? '/andelsoverdragelse' : '',
  assetPrefix: isProd ? '/andelsoverdragelse/' : '',
  // Expose basePath to client components so links are constructed correctly
  env: {
    NEXT_PUBLIC_BASE_PATH: isProd ? '/andelsoverdragelse' : '',
  },
  images: {
    // Static export doesn't support Next.js image optimisation
    unoptimized: true,
  },
  // API routes are excluded from static export automatically.
  // Trailing slash ensures index.html files are generated per route.
  trailingSlash: true,
}

export default nextConfig
