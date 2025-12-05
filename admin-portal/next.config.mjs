/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      // BoardGameGeek images
      {
        protocol: 'https',
        hostname: 'cf.geekdo-images.com',
        pathname: '/**',
      },
      // Supabase Storage (Cloud)
      {
        protocol: 'https',
        hostname: '*.supabase.co',
        pathname: '/storage/v1/object/public/**',
      },
      // Other game-related image sources
      {
        protocol: 'https',
        hostname: 'm.media-amazon.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'boardgamechamps.com',
        pathname: '/**',
      },
      {
        protocol: 'https',
        hostname: 'cdn11.bigcommerce.com',
        pathname: '/**',
      },
    ],
  },

  // Optimize for production deployment
  output: 'standalone',
};

export default nextConfig;
