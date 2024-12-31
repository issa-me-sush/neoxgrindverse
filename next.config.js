/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    domains: [
      'images.unsplash.com',
      'maps.googleapis.com',
      'lh3.googleusercontent.com',
      'api.mapbox.com',
      'ipfs.io',
      'dweb.link',
      'cloudflare-ipfs.com',
      'gateway.pinata.cloud'
    ],
    minimumCacheTTL: 60,
    unoptimized: true
  },
  reactStrictMode: true,
}

module.exports = nextConfig 