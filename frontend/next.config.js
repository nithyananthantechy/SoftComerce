/** @type {import('next').NextConfig} */
const nextConfig = {
  // API calls are proxied via app/api/[...path]/route.ts which correctly
  // forwards Set-Cookie and Cookie headers (rewrites() doesn't do this reliably)
};

module.exports = nextConfig;
