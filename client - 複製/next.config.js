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
}

module.exports = nextConfig