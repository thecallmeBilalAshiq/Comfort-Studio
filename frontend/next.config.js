/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'images.unsplash.com' },
      { protocol: 'https', hostname: 'via.placeholder.com' },
    ],
  },
  allowedDevOrigins: ['http://localhost:3000', 'http://192.168.18.129:3000', 'http://192.168.*:3000'],
};

module.exports = nextConfig;
