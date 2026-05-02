import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /** Legacy demo URLs referenced `.png`; committed stills are `.svg` under `public/evidence/safety/`. */
  async redirects() {
    return [
      {
        source: "/evidence/safety/:slug.png",
        destination: "/evidence/safety/:slug.svg",
        permanent: false,
      },
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
