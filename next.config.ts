import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Hide the Next.js footprint
  poweredByHeader: false,

  // Set strict HTTP security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Permissions-Policy',
            value: 'camera=(), microphone=(), geolocation=()'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://challenges.cloudflare.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: https://firebasestorage.googleapis.com; connect-src 'self' https://*.firebaseio.com https://*.firebasedatabase.app https://identitytoolkit.googleapis.com https://securetoken.googleapis.com https://challenges.cloudflare.com https://firebaseinstallations.googleapis.com https://www.googleapis.com https://docs.google.com; frame-src 'self' https://challenges.cloudflare.com https://docs.google.com; object-src 'none'; base-uri 'self';"
          }
        ]
      }
    ];
  }
};

export default nextConfig;
