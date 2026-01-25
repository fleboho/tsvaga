/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
    // Allow local images from /public/uploads
    unoptimized: process.env.NODE_ENV === 'development', // Disable optimization in dev for local files
  },
}

module.exports = nextConfig
