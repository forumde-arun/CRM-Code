/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // Same role as the old Vite proxy: the browser calls /api/*, Next forwards it to the Express backend.
  async rewrites() {
    return [{ source: '/api/:path*', destination: `${process.env.BACKEND_URL || 'http://localhost:5000'}/api/:path*` }];
  },
  async headers() {
    return [{ source: '/(.*)', headers: [{ key: 'X-Content-Type-Options', value: 'nosniff' }, { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' }] }];
  },
};
module.exports = nextConfig;
