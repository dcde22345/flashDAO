/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    domains: ['*'],
    dangerouslyAllowSVG: true,
    unoptimized: true,
  },
  reactStrictMode: true,
  experimental: {
    skipTrailingSlashRedirect: true,
    skipMiddlewareUrlNormalize: true,
    largePageDataBytes: 128 * 1000,
    suppressHydrationWarning: true,
  },
}

module.exports = nextConfig