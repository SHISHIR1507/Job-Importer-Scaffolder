/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  
  // Environment variables that should be available to the browser
  // Variables prefixed with NEXT_PUBLIC_ are automatically exposed
  env: {
    // NEXT_PUBLIC_API_URL is loaded from .env.local automatically
    // No need to explicitly define it here unless you want defaults
  },

  // Optional: If you want to proxy API requests instead of direct fetch
  // async rewrites() {
  //   return [
  //     {
  //       source: '/api/:path*',
  //       destination: `${process.env.NEXT_PUBLIC_API_URL}/api/:path*`,
  //     },
  //   ];
  // },
};

module.exports = nextConfig;

