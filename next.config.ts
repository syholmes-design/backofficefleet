import type { NextConfig } from "next";

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "X-DNS-Prefetch-Control", value: "off" },
];

const nextConfig: NextConfig = {
  poweredByHeader: false,
  productionBrowserSourceMaps: false,
  serverExternalPackages: ["@prisma/adapter-pg", "@prisma/client"],
  experimental: {
    authInterrupts: true,
  },
  async headers() {
    return [{ source: "/:path*", headers: securityHeaders }];
  },
  /** URLs from the retired `main` layout, kept working: each now lives at its canonical page. */
  async redirects() {
    return [
      { source: "/customer-portal/request-shipment", destination: "/customer-portal/load-intake", permanent: true },
      { source: "/demo", destination: "/interactive-demo", permanent: true },
      { source: "/demo/walkthrough", destination: "/interactive-demo", permanent: true },
    ];
  },
  async rewrites() {
    return {
      /** Run after `public/` so real files (e.g. driver `.html`) are served; API fills missing `.svg`. */
      afterFiles: [
        {
          source: "/generated/:path*",
          destination: "/api/bof-generated/:path*",
        },
      ],
    };
  },
};

export default nextConfig;
