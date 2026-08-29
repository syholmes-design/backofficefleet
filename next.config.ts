import type { NextConfig } from "next";

const nextConfig: NextConfig = {
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
